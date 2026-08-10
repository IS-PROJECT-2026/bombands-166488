'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const WORD_LENGTH = 5
const MAX_GUESSES = 6

// Used for the Daily word (deterministic by date) and as an offline fallback for Practice
const WORDS = [
  'apple', 'brave', 'crane', 'delta', 'eagle', 'flame', 'grape', 'house',
  'input', 'joker', 'knock', 'lemon', 'mango', 'noise', 'ocean', 'piano',
  'query', 'river', 'stone', 'table', 'unite', 'vivid', 'water', 'xenon',
  'youth', 'zebra', 'chair', 'dance', 'earth', 'fruit',
]

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty'

function evaluateGuess(guess: string, target: string): LetterStatus[] {
  const result: LetterStatus[] = Array(WORD_LENGTH).fill('absent')
  const targetLetters = target.split('')
  const guessLetters = guess.split('')
  const letterCounts: Record<string, number> = {}

  targetLetters.forEach((l) => {
    letterCounts[l] = (letterCounts[l] || 0) + 1
  })

  // first pass: correct positions
  guessLetters.forEach((letter, i) => {
    if (letter === targetLetters[i]) {
      result[i] = 'correct'
      letterCounts[letter]--
    }
  })

  // second pass: present but wrong position
  guessLetters.forEach((letter, i) => {
    if (result[i] === 'correct') return
    if (letterCounts[letter] > 0) {
      result[i] = 'present'
      letterCounts[letter]--
    }
  })

  return result
}

function getDailyWord(): string {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000)
  return WORDS[daysSinceEpoch % WORDS.length]
}

function getRandomWord(exclude?: string): string {
  let word = WORDS[Math.floor(Math.random() * WORDS.length)]
  while (word === exclude) {
    word = WORDS[Math.floor(Math.random() * WORDS.length)]
  }
  return word
}

async function fetchRandomPracticeWord(exclude?: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch('https://random-word-api.herokuapp.com/word?length=5')
      const data = await res.json()
      const word = (data[0] || '').toLowerCase()

      if (word.length === 5 && /^[a-z]+$/.test(word) && word !== exclude) {
        // confirm it's a real, defined word before using it as a target
        const check = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        if (check.status === 200) return word
      }
    } catch {
      // network hiccup — just retry
    }
  }
  // fallback if the API is unreachable or every attempt failed
  return getRandomWord(exclude)
}

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
]

export default function WordlePage() {
  const [mode, setMode] = useState<'daily' | 'practice'>('daily')
  const [target, setTarget] = useState('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [message, setMessage] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isLoadingWord, setIsLoadingWord] = useState(false)
  const validatedWordsCache = useRef<Map<string, boolean>>(new Map())

  useEffect(() => {
    async function loadTarget() {
      setGuesses([])
      setCurrentGuess('')
      setStatus('playing')
      setMessage('')

      if (mode === 'daily') {
        setTarget(getDailyWord())
      } else {
        setIsLoadingWord(true)
        const word = await fetchRandomPracticeWord()
        setTarget(word)
        setIsLoadingWord(false)
      }
    }
    loadTarget()
  }, [mode])

  async function isRealWord(word: string): Promise<boolean> {
    const cache = validatedWordsCache.current
    if (cache.has(word)) return cache.get(word)!

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      const valid = res.status === 200
      cache.set(word, valid)
      return valid
    } catch {
      // network failure — fail open so the game stays playable
      return true
    }
  }

  const submitGuess = useCallback(async () => {
    if (status !== 'playing' || isValidating || isLoadingWord) return
    if (currentGuess.length !== WORD_LENGTH) {
      setMessage('Not enough letters')
      return
    }

    setIsValidating(true)
    const valid = await isRealWord(currentGuess)
    setIsValidating(false)

    if (!valid) {
      setMessage('Not a real word')
      return
    }

    const newGuesses = [...guesses, currentGuess]
    setGuesses(newGuesses)
    setCurrentGuess('')
    setMessage('')

    if (currentGuess === target) {
      setStatus('won')
    } else if (newGuesses.length === MAX_GUESSES) {
      setStatus('lost')
    }
  }, [currentGuess, guesses, target, status, isValidating, isLoadingWord])

  const handleKey = useCallback(
    (key: string) => {
      if (status !== 'playing' || isValidating || isLoadingWord) return
      if (key === 'enter') {
        submitGuess()
      } else if (key === 'backspace') {
        setCurrentGuess((g) => g.slice(0, -1))
      } else if (/^[a-z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((g) => g + key)
        setMessage('')
      }
    },
    [currentGuess, status, submitGuess, isValidating, isLoadingWord]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'enter' || key === 'backspace' || /^[a-z]$/.test(key)) {
        handleKey(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  // track best-known status per letter for keyboard coloring
  const keyStatuses: Record<string, LetterStatus> = {}
  guesses.forEach((guess) => {
    const evalResult = evaluateGuess(guess, target)
    guess.split('').forEach((letter, i) => {
      const current = keyStatuses[letter]
      const next = evalResult[i]
      if (
        !current ||
        (current === 'absent' && next !== 'absent') ||
        (current === 'present' && next === 'correct')
      ) {
        keyStatuses[letter] = next
      }
    })
  })

  const statusColor: Record<LetterStatus, string> = {
    correct: 'bg-green-500 text-white border-green-500',
    present: 'bg-yellow-500 text-white border-yellow-500',
    absent: 'bg-gray-600 text-white border-gray-600',
    empty: 'bg-transparent border-gray-300',
  }

  return (
    <main className="flex flex-col items-center p-6 gap-6">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('daily')}
          className={`px-4 py-2 rounded border ${
            mode === 'daily'
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-gray-300 border-gray-600'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setMode('practice')}
          className={`px-4 py-2 rounded border ${
            mode === 'practice'
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-gray-300 border-gray-600'
          }`}
        >
          Practice
        </button>
        {mode === 'practice' && status !== 'playing' && (
          <button
            onClick={async () => {
              setIsLoadingWord(true)
              const word = await fetchRandomPracticeWord(target)
              setTarget(word)
              setGuesses([])
              setCurrentGuess('')
              setStatus('playing')
              setMessage('')
              setIsLoadingWord(false)
            }}
            className="px-4 py-2 rounded bg-blue-500 text-white"
            disabled={isLoadingWord}
          >
            New word
          </button>
        )}
      </div>

        <p className="text-sm text-gray-400">
          Guess {guesses.length + (status === 'playing' ? 1 : 0)} of {MAX_GUESSES}
        </p>

      <div className="flex flex-col gap-1">
        {Array.from({ length: MAX_GUESSES }).map((_, row) => {
          const guess = guesses[row]
          const isCurrentRow = row === guesses.length
          const letters = guess
            ? guess.split('')
            : isCurrentRow
            ? currentGuess.padEnd(WORD_LENGTH).split('')
            : Array(WORD_LENGTH).fill('')
          const evalResult = guess ? evaluateGuess(guess, target) : null

          return (
            <div key={row} className="flex gap-1">
              {letters.map((letter, col) => (
                <div
                  key={col}
                  className={`w-12 h-12 flex items-center justify-center border-2 text-xl font-bold uppercase ${
                    evalResult ? statusColor[evalResult[col]] : 'border-gray-300'
                  }`}
                >
                  {letter.trim()}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {isLoadingWord && <p className="text-gray-400 text-sm">Loading new word...</p>}
      {isValidating && <p className="text-gray-400 text-sm">Checking word...</p>}
      {message && <p className="text-red-500 text-sm">{message}</p>}
      {status === 'won' && <p className="text-green-600 font-bold">You got it! 🎉</p>}
      {status === 'lost' && (
        <p className="text-red-600 font-bold">Out of guesses — the word was {target.toUpperCase()}</p>
      )}

      <div className="flex flex-col gap-1 mt-4">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex gap-1 justify-center">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className={`px-2 py-3 rounded text-xs font-semibold uppercase border border-gray-600 ${
                  key === 'enter' || key === 'backspace'
                    ? 'px-3 bg-gray-700 text-white'
                    : keyStatuses[key]
                    ? statusColor[keyStatuses[key]]
                    : 'bg-gray-800 text-white'
                }`}
              >
                {key === 'backspace' ? '⌫' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}