'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Puzzle = {
  theme: string
  grid: string[][]
  words: string[]
}

const PUZZLES: Puzzle[] = [
  {
    theme: 'Git Basics',
    grid: [
      ['K', 'J', 'Q', 'V', 'W', 'L', 'M', 'I'],
      ['R', 'E', 'A', 'C', 'T', 'N', 'E', 'S'],
      ['P', 'K', 'J', 'Q', 'V', 'W', 'R', 'S'],
      ['B', 'R', 'A', 'N', 'C', 'H', 'G', 'U'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'E', 'E'],
      ['R', 'E', 'P', 'O', 'K', 'J', 'Q', 'V'],
      ['W', 'L', 'N', 'M', 'P', 'K', 'J', 'Q'],
      ['V', 'W', 'L', 'N', 'M', 'P', 'K', 'J'],
    ],
    words: ['REACT', 'BRANCH', 'REPO', 'MERGE', 'ISSUE'],
  },
  {
    theme: 'Git Commands',
    grid: [
      ['K', 'J', 'Q', 'V', 'W', 'L', 'P', 'P'],
      ['S', 'T', 'A', 'S', 'H', 'N', 'U', 'U'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'S', 'L'],
      ['F', 'E', 'T', 'C', 'H', 'N', 'H', 'L'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'M', 'P'],
      ['C', 'L', 'O', 'N', 'E', 'K', 'J', 'Q'],
      ['W', 'L', 'N', 'M', 'P', 'K', 'J', 'Q'],
      ['V', 'W', 'L', 'N', 'M', 'P', 'K', 'J'],
    ],
    words: ['STASH', 'FETCH', 'CLONE', 'PUSH', 'PULL'],
  },
]

function getDailyPuzzle(): Puzzle {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000)
  return PUZZLES[daysSinceEpoch % PUZZLES.length]
}

function getRandomPuzzle(exclude?: Puzzle): Puzzle {
  let puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
  while (puzzle === exclude && PUZZLES.length > 1) {
    puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
  }
  return puzzle
}

type Cell = [number, number]

function getLine(start: Cell, end: Cell): Cell[] | null {
  const [r1, c1] = start
  const [r2, c2] = end
  const dr = r2 - r1
  const dc = c2 - c1
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null
  const steps = Math.max(Math.abs(dr), Math.abs(dc))
  if (steps === 0) return null
  const stepR = dr === 0 ? 0 : dr / steps
  const stepC = dc === 0 ? 0 : dc / steps
  const cells: Cell[] = []
  for (let i = 0; i <= steps; i++) {
    cells.push([r1 + stepR * i, c1 + stepC * i])
  }
  return cells
}

function cellKey(cell: Cell): string {
  return `${cell[0]}-${cell[1]}`
}

const CONFETTI_EMOJIS = ['🎉', '🎊', '✨', '⭐', '🎈']

function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const pieces = Array.from({ length: 250 })
  return (
    <div key={burstKey} className="pointer-events-none fixed inset-0 overflow-hidden z-50">
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

const STREAK_KEY = 'bombands_wordsearch_streak'
type StreakData = { count: number; lastWinDate: string | null }

function getStreak(): StreakData {
  if (typeof window === 'undefined') return { count: 0, lastWinDate: null }
  const raw = localStorage.getItem(STREAK_KEY)
  return raw ? JSON.parse(raw) : { count: 0, lastWinDate: null }
}

function updateStreak(): StreakData {
  const today = new Date().toDateString()
  const current = getStreak()
  if (current.lastWinDate === today) return current
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const next: StreakData = { count: current.lastWinDate === yesterday ? current.count + 1 : 1, lastWinDate: today }
  localStorage.setItem(STREAK_KEY, JSON.stringify(next))
  return next
}

export default function WordSearchPage() {
  const [mode, setMode] = useState<'daily' | 'practice'>('daily')
  const [puzzle, setPuzzle] = useState<Puzzle>(PUZZLES[0])
  const [start, setStart] = useState<Cell | null>(null)
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set())
  const [shakeCell, setShakeCell] = useState<Cell | null>(null)
  const [status, setStatus] = useState<'playing' | 'won'>('playing')
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastWinDate: null })
  const [confettiKey, setConfettiKey] = useState<number | null>(null)
  const confettiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setStreak(getStreak())
  }, [])

  useEffect(() => {
    setPuzzle(mode === 'daily' ? getDailyPuzzle() : getRandomPuzzle())
    setStart(null)
    setFoundWords(new Set())
    setFoundCells(new Set())
    setStatus('playing')
  }, [mode])

  useEffect(() => {
    if (puzzle.words.length > 0 && foundWords.size === puzzle.words.length) {
      setStatus('won')
    }
  }, [foundWords, puzzle])

  useEffect(() => {
    if (status === 'won') {
      if (mode === 'daily') setStreak(updateStreak())
      if (confettiTimeout.current) clearTimeout(confettiTimeout.current)
      setConfettiKey(Date.now())
      confettiTimeout.current = setTimeout(() => setConfettiKey(null), 8000)
    }
    return () => {
      if (confettiTimeout.current) clearTimeout(confettiTimeout.current)
    }
  }, [status, mode])

  const handleCellClick = useCallback(
    (cell: Cell) => {
      if (status !== 'playing') return

      if (!start) {
        setStart(cell)
        return
      }

      if (start[0] === cell[0] && start[1] === cell[1]) {
        setStart(null)
        return
      }

      const line = getLine(start, cell)
      if (!line) {
        setShakeCell(cell)
        setTimeout(() => setShakeCell(null), 400)
        setStart(null)
        return
      }

      const forward = line.map(([r, c]) => puzzle.grid[r][c]).join('')
      const backward = forward.split('').reverse().join('')
      const match = puzzle.words.find(
        (w) => (w === forward || w === backward) && !foundWords.has(w)
      )

      if (match) {
        setFoundWords((prev) => new Set(prev).add(match))
        setFoundCells((prev) => {
          const next = new Set(prev)
          line.forEach((c) => next.add(cellKey(c)))
          return next
        })
      } else {
        setShakeCell(cell)
        setTimeout(() => setShakeCell(null), 400)
      }
      setStart(null)
    },
    [start, status, puzzle, foundWords]
  )

  return (
    <main className="flex justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg flex flex-col items-center gap-4 sm:gap-6 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black/40 p-4 sm:p-8 shadow-lg">
        {confettiKey !== null && <ConfettiBurst burstKey={confettiKey} />}

        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Word Search</h1>

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
          {mode === 'practice' && status === 'won' && (
            <button
              onClick={() => {
                const next = getRandomPuzzle(puzzle)
                setPuzzle(next)
                setStart(null)
                setFoundWords(new Set())
                setFoundCells(new Set())
                setStatus('playing')
              }}
              className="px-4 py-2 rounded bg-blue-500 text-white transition active:scale-95 hover:brightness-110"
            >
              New puzzle
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          {mode === 'daily' && <p>🔥 Streak: {streak.count}</p>}
          <p>Theme: {puzzle.theme}</p>
        </div>

        <div className="grid grid-cols-8 gap-1 select-none">
          {puzzle.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = cellKey([r, c])
              const isFound = foundCells.has(key)
              const isStart = start && start[0] === r && start[1] === c
              const isShaking = shakeCell && shakeCell[0] === r && shakeCell[1] === c
              return (
                <button
                  key={key}
                  onClick={() => handleCellClick([r, c])}
                  disabled={status !== 'playing'}
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded text-xs sm:text-sm font-bold uppercase border transition ${
                    isShaking ? 'shake' : ''
                  } ${
                    isFound
                      ? 'bg-green-500 text-white border-green-500'
                      : isStart
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-400 dark:border-gray-600 hover:brightness-110'
                  }`}
                >
                  {letter}
                </button>
              )
            })
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {puzzle.words.map((word) => (
            <span
              key={word}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                foundWords.has(word)
                  ? 'bg-green-500 text-white border-green-500 line-through'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-400 dark:border-gray-600'
              }`}
            >
              {word}
            </span>
          ))}
        </div>

        {status === 'won' && (
          <p className="win-pop text-green-600 dark:text-green-400 font-bold text-lg">All found! 🎉</p>
        )}
      </div>
    </main>
  )
}