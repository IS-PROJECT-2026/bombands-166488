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

  guessLetters.forEach((letter, i) => {
    if (letter === targetLetters[i]) {
      result[i] = 'correct'
      letterCounts[letter]--
    }
  })

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
        const check = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        if (check.status === 200) return word
      }
    } catch {
      // network hiccup — just retry
    }
  }
  return getRandomWord(exclude)
}

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
]

function buildShareText(guesses: string[], target: string, mode: string): string {
  const emojiMap: Record<LetterStatus, string> = {
    correct: '🟩',
    present: '🟨',
    absent: '⬛',
    empty: '⬜',
  }
  const grid = guesses
    .map((guess) =>
      evaluateGuess(guess, target)
        .map((s) => emojiMap[s])
        .join('')
    )
    .join('\n')

  const label = mode === 'daily' ? 'Daily' : 'Practice'
  return `BOMBANDS Wordle (${label}) ${guesses.length}/${MAX_GUESSES}\nPlay NOW: https://is-project-2026.github.io/bombands-166488/games/wordle\n\n${grid}`
}

const STREAK_KEY = 'bombands_wordle_streak'

type StreakData = { count: number; lastWinDate: string | null }

function getStreak(): StreakData {
  if (typeof window === 'undefined') return { count: 0, lastWinDate: null }
  const raw = localStorage.getItem(STREAK_KEY)
  return raw ? JSON.parse(raw) : { count: 0, lastWinDate: null }
}

function updateStreak(won: boolean): StreakData {
  const today = new Date().toDateString()
  const current = getStreak()

  if (current.lastWinDate === today) return current

  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const next: StreakData = won
    ? {
        count: current.lastWinDate === yesterday ? current.count + 1 : 1,
        lastWinDate: today,
      }
    : { count: 0, lastWinDate: today }

  localStorage.setItem(STREAK_KEY, JSON.stringify(next))
  return next
}

export default function WordlePage() {
  // ── State ──────────────────────────────────────────────
  const [mode, setMode] = useState<'daily' | 'practice'>('daily')
  const [target, setTarget] = useState('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [message, setMessage] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isLoadingWord, setIsLoadingWord] = useState(false)
  const [shakeRow, setShakeRow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastWinDate: null })

  const validatedWordsCache = useRef<Map<string, boolean>>(new Map())
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  // ── Effects ────────────────────────────────────────────
  useEffect(() => {
    hiddenInputRef.current?.focus()
  }, [])

  useEffect(() => {
    setStreak(getStreak())
  }, [])

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

  useEffect(() => {
    if (mode === 'daily' && (status === 'won' || status === 'lost')) {
      setStreak(updateStreak(status === 'won'))
    }
  }, [status, mode])

  // ── Helpers ────────────────────────────────────────────
  async function isRealWord(word: string): Promise<boolean> {
    const cache = validatedWordsCache.current
    if (cache.has(word)) return cache.get(word)!

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      const valid = res.status === 200
      cache.set(word, valid)
      return valid
    } catch {
      return true
    }
  }

  async function handleShare() {
    const text = buildShareText(guesses, target, mode)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submitGuess = useCallback(async () => {
    if (status !== 'playing' || isValidating || isLoadingWord) return
    if (currentGuess.length !== WORD_LENGTH) {
      setMessage('Not enough letters')
      setShakeRow(true)
      setTimeout(() => setShakeRow(false), 500)
      return
    }

    setIsValidating(true)
    const valid = await isRealWord(currentGuess)
    setIsValidating(false)

    if (!valid) {
      setMessage('Not a real word')
      setShakeRow(true)
      setTimeout(() => setShakeRow(false), 500)
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

  // ── Render ─────────────────────────────────────────────
  return (
    <main className="flex justify-center p-4 sm:p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-4 sm:gap-6 border border-gray-700 rounded-xl bg-black/40 p-4 sm:p-8 shadow-lg">
        <input
          ref={hiddenInputRef}
          type="text"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          className="absolute opacity-0 w-0 h-0"
          onKeyDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const key = e.key.toLowerCase()
            if (key === 'enter' || key === 'backspace' || /^[a-z]$/.test(key)) {
              handleKey(key)
            }
          }}
        />

        <h1 className="text-xl font-bold">Wordle</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('daily')}
            className={`px-4 py-2 rounded border transition active:scale-95 hover:brightness-110 ${
              mode === 'daily'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-gray-300 border-gray-600'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setMode('practice')}
            className={`px-4 py-2 rounded border transition active:scale-95 hover:brightness-110 ${
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
              className="px-4 py-2 rounded bg-blue-500 text-white transition active:scale-95 hover:brightness-110"
              disabled={isLoadingWord}
            >
              New word
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 text-sm text-gray-400">
          {mode === 'daily' && <p>🔥 Streak: {streak.count}</p>}
          <p>
            Guess {guesses.length + (status === 'playing' ? 1 : 0)} of {MAX_GUESSES}
          </p>
        </div>

        <div onClick={() => hiddenInputRef.current?.focus()} className="flex flex-col gap-1">
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
              <div
                key={row}
                className={`flex gap-1 ${isCurrentRow && shakeRow ? 'shake' : ''}`}
              >
                {letters.map((letter, col) => (
                  <div
                    key={col}
                    style={evalResult ? { animationDelay: `${col * 150}ms` } : undefined}
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-2 text-lg sm:text-xl font-bold uppercase ${
                      evalResult ? `${statusColor[evalResult[col]]} tile-flip` : 'border-gray-300'
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
        {status === 'won' && (
          <p className="win-pop text-green-600 font-bold text-lg">You got it! 🎉</p>
        )}
        {status === 'lost' && (
          <p className="win-pop text-red-600 font-bold">
            Out of guesses — the word was {target.toUpperCase()}
          </p>
        )}

        {(status === 'won' || status === 'lost') && (
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded bg-white text-black font-semibold transition active:scale-95 hover:brightness-110"
          >
            {copied ? 'Copied!' : 'Share Results'}
          </button>
        )}

        <div className="flex flex-col gap-1 mt-2 w-full">
          {KEYBOARD_ROWS.map((row, i) => (
            <div key={i} className="flex gap-1 justify-center">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className={`px-1.5 sm:px-2 py-2.5 sm:py-3 rounded text-[10px] sm:text-xs font-semibold uppercase border border-gray-600 transition active:scale-90 hover:brightness-125 ${
                    key === 'enter' || key === 'backspace'
                      ? 'px-2.5 sm:px-3 bg-gray-700 text-white'
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
      </div>
    </main>
  )
}