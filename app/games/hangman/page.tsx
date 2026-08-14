'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const MAX_WRONG = 6

const WORDS = [
  'react', 'server', 'client', 'branch', 'commit', 'github', 'puzzle',
  'wordle', 'sudoku', 'crossword', 'scrabble', 'javascript', 'component',
  'render', 'stateful', 'hooks', 'keyboard', 'network', 'deploy', 'streak',
]

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
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

const STREAK_KEY = 'bombands_hangman_streak'
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
    ? { count: current.lastWinDate === yesterday ? current.count + 1 : 1, lastWinDate: today }
    : { count: 0, lastWinDate: today }
  localStorage.setItem(STREAK_KEY, JSON.stringify(next))
  return next
}

const CONFETTI_EMOJIS = ['🎉', '🎊', '✨', '⭐', '🎈']

function ConfettiBurst() {
  const pieces = Array.from({ length: 250 })
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {pieces.map((_, i) => {
        const emoji = CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length]
        const left = Math.random() * 100
        const delay = Math.random() * 0.8
        const duration = 3 + Math.random() * 3
        return (
          <span
            key={i}
            className="absolute top-0 text-2xl confetti-piece"
            style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
          >
            {emoji}
          </span>
        )
      })}
    </div>
  )
}

function Gallows({ wrongCount }: { wrongCount: number }) {
  return (
    <svg viewBox="0 0 200 220" className="w-40 h-44 sm:w-48 sm:h-52">
      {/* base + pole (always visible) */}
      <line x1="20" y1="210" x2="120" y2="210" stroke="currentColor" strokeWidth="4" />
      <line x1="50" y1="210" x2="50" y2="20" stroke="currentColor" strokeWidth="4" />
      <line x1="50" y1="20" x2="140" y2="20" stroke="currentColor" strokeWidth="4" />
      <line x1="140" y1="20" x2="140" y2="45" stroke="currentColor" strokeWidth="4" />

      {wrongCount >= 1 && <circle cx="140" cy="65" r="20" fill="none" stroke="#ef4444" strokeWidth="4" />}
      {wrongCount >= 2 && <line x1="140" y1="85" x2="140" y2="140" stroke="#ef4444" strokeWidth="4" />}
      {wrongCount >= 3 && <line x1="140" y1="100" x2="115" y2="125" stroke="#ef4444" strokeWidth="4" />}
      {wrongCount >= 4 && <line x1="140" y1="100" x2="165" y2="125" stroke="#ef4444" strokeWidth="4" />}
      {wrongCount >= 5 && <line x1="140" y1="140" x2="118" y2="175" stroke="#ef4444" strokeWidth="4" />}
      {wrongCount >= 6 && <line x1="140" y1="140" x2="162" y2="175" stroke="#ef4444" strokeWidth="4" />}
    </svg>
  )
}

export default function HangmanPage() {
  const [mode, setMode] = useState<'daily' | 'practice'>('daily')
  const [target, setTarget] = useState('')
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [shake, setShake] = useState(false)
  const [copied, setCopied] = useState(false)
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastWinDate: null })
  const [showConfetti, setShowConfetti] = useState(false)
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    hiddenInputRef.current?.focus()
  }, [])

  useEffect(() => {
    setStreak(getStreak())
  }, [])

  useEffect(() => {
    setTarget(mode === 'daily' ? getDailyWord() : getRandomWord())
    setGuessedLetters(new Set())
    setStatus('playing')
  }, [mode])

  const wrongCount = [...guessedLetters].filter((l) => !target.includes(l)).length

  useEffect(() => {
    if (!target || status !== 'playing') return
    const allRevealed = target.split('').every((l) => guessedLetters.has(l))
    if (allRevealed) {
      setStatus('won')
    } else if (wrongCount >= MAX_WRONG) {
      setStatus('lost')
    }
  }, [guessedLetters, target, status, wrongCount])

  useEffect(() => {
    if (mode === 'daily' && (status === 'won' || status === 'lost')) {
      setStreak(updateStreak(status === 'won'))
    }
  }, [status, mode])

  useEffect(() => {
    if (status === 'won') {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const guessLetter = useCallback(
    (letter: string) => {
      if (status !== 'playing' || guessedLetters.has(letter)) return
      const next = new Set(guessedLetters)
      next.add(letter)
      setGuessedLetters(next)
      if (!target.includes(letter)) {
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
    },
    [guessedLetters, target, status]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (/^[a-z]$/.test(key)) guessLetter(key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [guessLetter])

  async function handleShare() {
    const label = mode === 'daily' ? 'Daily' : 'Practice'
    const text = `BOMBANDS Hangman (${label}) — ${status === 'won' ? `Won with ${MAX_WRONG - wrongCount} lives left! 🎉` : 'Lost this one 💀'}\nPlay: https://is-project-2026.github.io/bombands-166488/games/hangman`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="flex justify-center p-4 sm:p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-4 sm:gap-6 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black/40 p-4 sm:p-8 shadow-lg">
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
            if (/^[a-z]$/.test(key)) guessLetter(key)
          }}
        />
        {showConfetti && <ConfettiBurst />}

        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hangman</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('daily')}
            className={`px-4 py-2 rounded border transition active:scale-95 hover:brightness-110 ${
              mode === 'daily'
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white'
                : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-400 dark:border-gray-600'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setMode('practice')}
            className={`px-4 py-2 rounded border transition active:scale-95 hover:brightness-110 ${
              mode === 'practice'
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white'
                : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-400 dark:border-gray-600'
            }`}
          >
            Practice
          </button>
          {mode === 'practice' && status !== 'playing' && (
            <button
              onClick={() => {
                setTarget(getRandomWord(target))
                setGuessedLetters(new Set())
                setStatus('playing')
              }}
              className="px-4 py-2 rounded bg-blue-500 text-white transition active:scale-95 hover:brightness-110"
            >
              New word
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          {mode === 'daily' && <p>🔥 Streak: {streak.count}</p>}
          <p>{MAX_WRONG - wrongCount} lives left</p>
        </div>

        <div onClick={() => hiddenInputRef.current?.focus()} className={`text-gray-900 dark:text-white ${shake ? 'shake' : ''}`}>
          <Gallows wrongCount={wrongCount} />
        </div>

        <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
          {target.split('').map((letter, i) => (
            <div
              key={i}
              className="w-8 h-10 sm:w-9 sm:h-11 flex items-end justify-center border-b-2 border-gray-500 dark:border-gray-500 text-lg sm:text-xl font-bold uppercase text-gray-900 dark:text-white"
            >
              {guessedLetters.has(letter) || status === 'lost' ? letter : ''}
            </div>
          ))}
        </div>

        {status === 'won' && <p className="win-pop text-green-600 dark:text-green-400 font-bold text-lg">You saved them! 🎉</p>}
        {status === 'lost' && (
          <p className="win-pop text-red-600 dark:text-red-400 font-bold">
            Out of lives — the word was {target.toUpperCase()}
          </p>
        )}

        {(status === 'won' || status === 'lost') && (
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-white dark:text-black font-semibold transition active:scale-95 hover:brightness-110"
          >
            {copied ? 'Copied!' : 'Share Results'}
          </button>
        )}

        <div className="flex flex-col gap-1 mt-2 w-full">
          {KEYBOARD_ROWS.map((row, i) => (
            <div key={i} className="flex gap-1 justify-center">
              {row.map((key) => {
                const guessed = guessedLetters.has(key)
                const correct = guessed && target.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => guessLetter(key)}
                    disabled={guessed || status !== 'playing'}
                    className={`px-2 sm:px-2.5 py-2.5 sm:py-3 rounded text-xs font-semibold uppercase border border-gray-400 dark:border-gray-600 transition active:scale-90 hover:brightness-125 disabled:cursor-not-allowed ${
                      guessed
                        ? correct
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-gray-400 dark:bg-gray-700 text-white opacity-50'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    {key}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}