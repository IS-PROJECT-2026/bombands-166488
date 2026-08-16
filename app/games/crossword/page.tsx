'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type ClueDirection = 'across' | 'down'

type Clue = {
  number: number
  direction: ClueDirection
  row: number
  col: number
  answer: string
  clue: string
}

type CrosswordPuzzle = {
  theme: string
  size: number
  clues: Clue[]
}

// '#' marks a blocked cell; everything else is buildable from the clues below
const PUZZLES: CrosswordPuzzle[] = [
  {
    theme: 'Git Basics',
    size: 7,
    clues: [
      { number: 1, direction: 'across', row: 0, col: 0, answer: 'BRANCH', clue: 'A separate line of development in Git' },
      { number: 2, direction: 'down', row: 0, col: 2, answer: 'ISSUE', clue: 'A tracked task or bug on GitHub' },
      { number: 3, direction: 'across', row: 2, col: 0, answer: 'MERGE', clue: 'Combining two branches into one' },
      { number: 4, direction: 'down', row: 0, col: 5, answer: 'COMMIT', clue: 'A saved snapshot of changes' },
      { number: 5, direction: 'across', row: 4, col: 1, answer: 'REPO', clue: 'Short for repository' },
    ],
  },
  {
    theme: 'GitHub Workflow',
    size: 7,
    clues: [
      { number: 1, direction: 'across', row: 0, col: 0, answer: 'CLONE', clue: 'Copy a repo to your local machine' },
      { number: 2, direction: 'down', row: 0, col: 1, answer: 'LABEL', clue: 'A colored tag on an issue or PR' },
      { number: 3, direction: 'across', row: 2, col: 0, answer: 'DEPLOY', clue: 'Publish your app to a live server' },
      { number: 4, direction: 'down', row: 0, col: 4, answer: 'STASH', clue: 'Temporarily shelve uncommitted changes' },
      { number: 5, direction: 'across', row: 4, col: 1, answer: 'FETCH', clue: 'Download changes without merging them' },
    ],
  },
]

type CellInfo = {
  correctLetter: string
  numbers: number[]
  clueRefs: { direction: ClueDirection; clueNumber: number }[]
}

function buildGrid(puzzle: CrosswordPuzzle): (CellInfo | null)[][] {
  const grid: (CellInfo | null)[][] = Array.from({ length: puzzle.size }, () =>
    Array(puzzle.size).fill(null)
  )

  puzzle.clues.forEach((clue) => {
    clue.answer.split('').forEach((letter, i) => {
      const r = clue.direction === 'across' ? clue.row : clue.row + i
      const c = clue.direction === 'across' ? clue.col + i : clue.col
      if (!grid[r][c]) {
        grid[r][c] = { correctLetter: letter, numbers: [], clueRefs: [] }
      }
      if (i === 0 && !grid[r][c]!.numbers.includes(clue.number)) {
        grid[r][c]!.numbers.push(clue.number)
      }
      grid[r][c]!.clueRefs.push({ direction: clue.direction, clueNumber: clue.number })
    })
  })

  return grid
}

function getDailyPuzzle(): CrosswordPuzzle {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000)
  return PUZZLES[daysSinceEpoch % PUZZLES.length]
}

function getRandomPuzzle(exclude?: CrosswordPuzzle): CrosswordPuzzle {
  let p = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
  while (p === exclude && PUZZLES.length > 1) {
    p = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
  }
  return p
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
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

const STREAK_KEY = 'bombands_crossword_streak'
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

const BEST_TIMES_KEY = 'bombands_crossword_besttimes'

function getBestTime(theme: string): number | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(BEST_TIMES_KEY)
  const times: Record<string, number> = raw ? JSON.parse(raw) : {}
  return times[theme] ?? null
}

function maybeUpdateBestTime(theme: string, seconds: number): number {
  const raw = localStorage.getItem(BEST_TIMES_KEY)
  const times: Record<string, number> = raw ? JSON.parse(raw) : {}
  const best = times[theme] === undefined || seconds < times[theme] ? seconds : times[theme]
  times[theme] = best
  localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(times))
  return best
}

export default function CrosswordPage() {
  const [mode, setMode] = useState<'daily' | 'practice'>('daily')
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle>(PUZZLES[0])
  const [gridInfo, setGridInfo] = useState<(CellInfo | null)[][]>([])
  const [entries, setEntries] = useState<string[][]>([])
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [direction, setDirection] = useState<ClueDirection>('across')
  const [status, setStatus] = useState<'playing' | 'won'>('playing')
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastWinDate: null })
  const [confettiKey, setConfettiKey] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const confettiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setStreak(getStreak())
  }, [])

  const loadPuzzle = useCallback((p: CrosswordPuzzle) => {
    const grid = buildGrid(p)
    setPuzzle(p)
    setGridInfo(grid)
    setEntries(grid.map((row) => row.map(() => '')))
    setBestTime(getBestTime(p.theme))
    setSelected(null)
    setDirection('across')
    setStatus('playing')
    setElapsed(0)
  }, [])

  useEffect(() => {
    loadPuzzle(mode === 'daily' ? getDailyPuzzle() : getRandomPuzzle())
  }, [mode, loadPuzzle])

  useEffect(() => {
    if (status !== 'playing') return
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [status, puzzle])

  useEffect(() => {
    if (gridInfo.length === 0) return
    const allCorrect = gridInfo.every((row, r) =>
      row.every((cell, c) => !cell || entries[r][c].toLowerCase() === cell.correctLetter)
    )
    if (allCorrect) setStatus('won')
  }, [entries, gridInfo])

  useEffect(() => {
    if (status === 'won') {
      if (mode === 'daily') setStreak(updateStreak())
      const best = maybeUpdateBestTime(puzzle.theme, elapsed)
      setBestTime(best)
      if (confettiTimeout.current) clearTimeout(confettiTimeout.current)
      setConfettiKey(Date.now())
      confettiTimeout.current = setTimeout(() => setConfettiKey(null), 8000)
    }
    return () => {
      if (confettiTimeout.current) clearTimeout(confettiTimeout.current)
    }
  }, [status, mode, puzzle, elapsed])

  function findNextCell(row: number, col: number, dir: ClueDirection, back = false): [number, number] | null {
    const step = back ? -1 : 1
    let r = row
    let c = col
    while (true) {
      r = dir === 'down' ? r + step : r
      c = dir === 'across' ? c + step : c
      if (r < 0 || c < 0 || r >= puzzle.size || c >= puzzle.size) return null
      if (gridInfo[r][c]) return [r, c]
    }
  }

  function handleCellClick(row: number, col: number) {
    if (!gridInfo[row][col] || status !== 'playing') return
    if (selected && selected[0] === row && selected[1] === col) {
      setDirection((d) => (d === 'across' ? 'down' : 'across'))
    } else {
      setSelected([row, col])
    }
  }

  function typeLetter(letter: string) {
    if (!selected || status !== 'playing') return
    const [r, c] = selected
    setEntries((prev) => {
      const next = prev.map((row) => [...row])
      next[r][c] = letter
      return next
    })
    const nextCell = findNextCell(r, c, direction)
    if (nextCell) setSelected(nextCell)
  }

  function eraseLetter() {
    if (!selected) return
    const [r, c] = selected
    if (entries[r][c]) {
      setEntries((prev) => {
        const next = prev.map((row) => [...row])
        next[r][c] = ''
        return next
      })
    } else {
      const prevCell = findNextCell(r, c, direction, true)
      if (prevCell) setSelected(prevCell)
    }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing') return
      const key = e.key.toLowerCase()
      if (/^[a-z]$/.test(key)) {
        typeLetter(key)
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        eraseLetter()
      } else if (e.key === 'ArrowRight') {
        setDirection('across')
        if (selected) {
          const next = findNextCell(selected[0], selected[1], 'across')
          if (next) setSelected(next)
        }
      } else if (e.key === 'ArrowDown') {
        setDirection('down')
        if (selected) {
          const next = findNextCell(selected[0], selected[1], 'down')
          if (next) setSelected(next)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, direction, status, gridInfo, entries])

  async function handleShare() {
    const label = mode === 'daily' ? 'Daily' : 'Practice'
    const text = `BOMBANDS Crossword (${label}) — Solved in ${formatTime(elapsed)}! 🎉\nPlay: https://is-project-2026.github.io/bombands-166488/games/crossword`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeClue = selected
    ? puzzle.clues.find(
        (c) =>
          gridInfo[selected[0]][selected[1]]?.clueRefs.some(
            (ref) => ref.direction === direction && ref.clueNumber === c.number
          )
      )
    : null

  return (
    <main className="flex justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl flex flex-col items-center gap-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black/40 p-4 sm:p-8 shadow-lg">
        {confettiKey !== null && <ConfettiBurst burstKey={confettiKey} />}

        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Crossword</h1>

        <div className="flex gap-2 flex-wrap justify-center">
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
              onClick={() => loadPuzzle(getRandomPuzzle(puzzle))}
              className="px-4 py-2 rounded bg-blue-500 text-white transition active:scale-95 hover:brightness-110"
            >
              New puzzle
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          {mode === 'daily' && <p>🔥 Streak: {streak.count}</p>}
          <p>Theme: {puzzle.theme}</p>
          <p>
            ⏱ {formatTime(elapsed)}
            {bestTime !== null && <span className="ml-2">🏆 Best: {formatTime(bestTime)}</span>}
          </p>
        </div>

        {activeClue && (
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 text-center">
            {activeClue.number} {activeClue.direction === 'across' ? 'Across' : 'Down'}: {activeClue.clue}
          </p>
        )}

        <div
          className="grid gap-0.5 select-none"
          style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
        >
          {gridInfo.flatMap((row, r) =>
            row.map((cell, c) => {
              const isSelected = selected && selected[0] === r && selected[1] === c
              const isInActiveClue =
                selected &&
                cell &&
                gridInfo[selected[0]][selected[1]]?.clueRefs.some(
                  (ref) =>
                    ref.direction === direction &&
                    activeClue &&
                    ref.clueNumber === activeClue.number
                ) &&
                cell.clueRefs.some(
                  (ref) => ref.direction === direction && activeClue && ref.clueNumber === activeClue.number
                )
              const isFilled = cell && entries[r][c] !== ''
              const isCorrect = cell && entries[r][c].toLowerCase() === cell.correctLetter

              if (!cell) {
                return <div key={`${r}-${c}`} className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-900 dark:bg-black" />
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={status !== 'playing'}
                  className={`relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base font-bold uppercase border transition ${
                    isSelected
                      ? 'bg-blue-400 border-blue-600 text-white'
                      : isInActiveClue
                      ? 'bg-blue-100 dark:bg-blue-900/40 border-gray-400 dark:border-gray-600'
                      : status === 'won' && isCorrect
                      ? 'bg-green-200 dark:bg-green-900/50 border-green-400 dark:border-green-700 text-green-900 dark:text-green-200'
                      : 'bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white hover:brightness-95 dark:hover:brightness-125'
                  }`}
                >
                  {cell.numbers.length > 0 && (
                    <span className="absolute top-0 left-0.5 text-[7px] sm:text-[8px] font-normal text-gray-500 dark:text-gray-400">
                      {cell.numbers[0]}
                    </span>
                  )}
                  {isFilled ? entries[r][c] : ''}
                </button>
              )
            })
          )}
        </div>

        {status === 'playing' && (
          <div className="flex gap-1 flex-wrap justify-center max-w-sm">
            {'abcdefghijklmnopqrstuvwxyz'.split('').map((letter) => (
              <button
                key={letter}
                onClick={() => typeLetter(letter)}
                disabled={!selected}
                className="w-7 h-8 sm:w-8 sm:h-9 rounded bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-semibold uppercase border border-gray-400 dark:border-gray-600 transition active:scale-90 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {letter}
              </button>
            ))}
            <button
              onClick={eraseLetter}
              disabled={!selected}
              className="px-3 h-8 sm:h-9 rounded bg-gray-400 dark:bg-gray-700 text-white text-xs font-semibold transition active:scale-90 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ⌫
            </button>
          </div>
        )}

        <div className="w-full grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Across</p>
            {puzzle.clues.filter((c) => c.direction === 'across').map((c) => (
              <p key={`a-${c.number}`}>{c.number}. {c.clue}</p>
            ))}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Down</p>
            {puzzle.clues.filter((c) => c.direction === 'down').map((c) => (
              <p key={`d-${c.number}`}>{c.number}. {c.clue}</p>
            ))}
          </div>
        </div>

        {status === 'won' && (
          <>
            <p className="win-pop text-green-600 dark:text-green-400 font-bold text-lg">
              Solved in {formatTime(elapsed)}! 🎉
            </p>
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-white dark:text-black font-semibold transition active:scale-95 hover:brightness-110"
            >
              {copied ? 'Copied!' : 'Share Results'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}