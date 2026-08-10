'use client'

import { useState, useCallback, useEffect } from 'react'

const WORD_LENGTH = 5
const MAX_GUESSES = 6

const WORDS = [
  'apple', 'brave', 'crane', 'delta', 'eagle', 'flame', 'grape', 'house',
  'input', 'joker', 'knock', 'lemon', 'mango', 'noise', 'ocean', 'piano',
  'query', 'river', 'stone', 'table', 'unite', 'vivid', 'water', 'xenon',
  'youth', 'zebra', 'chair', 'dance', 'earth', 'fruit',
]

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

export default function WordlePage() {
  const [mode, setMode] = useState<'daily' | 'practice'>('daily')
  const [target, setTarget] = useState(getDailyWord())
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
const [message, setMessage] = useState('')

const submitGuess = useCallback(() => {
if (status !== 'playing') return
if (currentGuess.length !== WORD_LENGTH) {
    setMessage('Not enough letters')
    return
}
if (!WORDS.includes(currentGuess)) {
    setMessage('Not in word list')
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
}, [currentGuess, guesses, target, status])

const handleKey = useCallback(
(key: string) => {
    if (status !== 'playing') return
    if (key === 'enter') {
    submitGuess()
    } else if (key === 'backspace') {
    setCurrentGuess((g) => g.slice(0, -1))
    } else if (/^[a-z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
    setCurrentGuess((g) => g + key)
    setMessage('')
    }
},
[currentGuess, status, submitGuess]
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

  return (
    <main className="flex flex-col items-center p-6 gap-6">
      <h1 className="text-2xl font-bold">Wordle</h1>
      <div className="flex gap-2">
        <button
          onClick={() => { setMode('daily'); setTarget(getDailyWord()) }}
          className={`px-4 py-2 rounded ${mode === 'daily' ? 'bg-black text-white' : 'bg-gold-200'}`}
        >
          Daily
        </button>
        <button
          onClick={() => { setMode('practice'); setTarget(getRandomWord()) }}
          className={`px-4 py-2 rounded ${mode === 'practice' ? 'bg-black text-white' : 'bg-gold-200'}`}
        >
          Practice
        </button>
      </div>

            <div className="flex flex-col gap-1">
        {Array.from({ length: MAX_GUESSES }).map((_, row) => {
            const guess = guesses[row]
            const isCurrentRow = row === guesses.length
            const letters = guess
            ? guess.split('')
            : isCurrentRow
            ? currentGuess.padEnd(WORD_LENGTH).split('')
            : Array(WORD_LENGTH).fill('')

            return (
            <div key={row} className="flex gap-1">
                {letters.map((letter, col) => (
                <div
                    key={col}
                    className="w-12 h-12 flex items-center justify-center border-2 border-gray-300 text-xl font-bold uppercase"
                >
                    {letter.trim()}
                </div>
                ))}
            </div>
            )
        })}
        </div>

        {message && <p className="text-red-500 text-sm">{message}</p>}

    </main>
  )
}