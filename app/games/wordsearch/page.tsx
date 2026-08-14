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
      ['B', 'R', 'A', 'N', 'C', 'H', 'K', 'R'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'X', 'E'],
      ['K', 'R', 'E', 'A', 'C', 'T', 'Y', 'P'],
      ['M', 'J', 'Q', 'V', 'W', 'L', 'Z', 'O'],
      ['K', 'E', 'Q', 'V', 'W', 'L', 'X', 'Y'],
      ['K', 'L', 'R', 'I', 'S', 'S', 'U', 'E'],
      ['K', 'J', 'Q', 'G', 'W', 'L', 'X', 'Y'],
      ['K', 'J', 'Q', 'V', 'E', 'L', 'X', 'Y'],
    ],
    words: ['REACT', 'BRANCH', 'REPO', 'MERGE', 'ISSUE'],
  },
  {
    theme: 'Git Commands',
    grid: [
      ['S', 'T', 'A', 'S', 'H', 'K', 'J', 'C'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'Z', 'L'],
      ['K', 'F', 'E', 'T', 'C', 'H', 'Y', 'O'],
      ['P', 'J', 'Q', 'V', 'W', 'L', 'Z', 'N'],
      ['K', 'U', 'Q', 'V', 'W', 'L', 'Z', 'E'],
      ['K', 'L', 'S', 'V', 'W', 'L', 'Z', 'Y'],
      ['K', 'J', 'Q', 'H', 'P', 'U', 'L', 'L'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'Z', 'Y'],
    ],
    words: ['STASH', 'FETCH', 'CLONE', 'PUSH', 'PULL'],
  },
  {
    theme: 'GitHub Actions',
    grid: [
      ['D', 'E', 'P', 'L', 'O', 'Y', 'K', 'J'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'Y', 'Q'],
      ['A', 'C', 'T', 'I', 'O', 'N', 'A', 'V'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'M', 'W'],
      ['B', 'U', 'I', 'L', 'D', 'K', 'L', 'L'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'K', 'J'],
      ['R', 'U', 'N', 'V', 'W', 'L', 'J', 'Q'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'Q', 'V'],
    ],
    words: ['DEPLOY', 'ACTION', 'BUILD', 'YAML', 'RUN'],
  },
  {
    theme: 'Branches & Merging',
    grid: [
      ['R', 'E', 'B', 'A', 'S', 'E', 'K', 'J'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'M', 'Q'],
      ['S', 'Q', 'U', 'A', 'S', 'H', 'A', 'V'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'I', 'W'],
      ['O', 'R', 'I', 'G', 'I', 'N', 'N', 'L'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'K', 'J'],
      ['H', 'E', 'A', 'D', 'W', 'L', 'J', 'Q'],
      ['K', 'J', 'Q', 'V', 'W', 'L', 'Q', 'V'],
    ],
    words: ['REBASE', 'SQUASH', 'ORIGIN', 'MAIN', 'HEAD'],
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

const BEST_TIMES_KEY = 'bombands_wordsearch_besttimes'

function getBestTime(theme: string): number | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(BEST_TIMES_KEY)
  const times: Record<string, number> = raw ? JSON.parse(raw) : {}
  return times[theme] ?? null
}

function maybeUpdateBestTime(theme: string, seconds: number): number {
  const raw = localStorage.getItem(BEST_TIMES_KEY)
  const times: Record<string, number> = raw ? JSON.parse(raw) : {}
  const current = times[theme]
  const best = current === undefined || seconds < current ? seconds : current
  times[theme] = best
  localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(times))
  return best
}

export default function WordSearchPage() {
  const [mode, setMode] = useState<'daily' | 'practice'>('daily')
  const [puzzle, setPuzzle] = useState<Puzzle>(PUZZLES[0])
  const [start, setStart] = useState<Cell | null>(null)
  const [dragEnd, setDragEnd] = useState<Cell | null>(null)
  const [dragging, setDragging] = useState(false)
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set())
  const [shakeCell, setShakeCell] = useState<Cell | null>(null)
  const [status, setStatus] = useState<'playing' | 'won'>('playing')
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastWinDate: null })
  const [confettiKey, setConfettiKey] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const confettiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setStreak(getStreak())
  }, [])

  useEffect(() => {
    const next = mode === 'daily' ? getDailyPuzzle() : getRandomPuzzle()
    setPuzzle(next)
    setBestTime(getBestTime(next.theme))
    setStart(null)
    setDragEnd(null)
    setFoundWords(new Set())
    setFoundCells(new Set())
    setStatus('playing')
    setElapsed(0)
  }, [mode])

  // Timer
  useEffect(() => {
    if (status !== 'playing') return
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [status, puzzle])

  useEffect(() => {
    if (puzzle.words.length > 0 && foundWords.size === puzzle.words.length) {
      setStatus('won')
    }
  }, [foundWords, puzzle])

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

  const evaluateSelection = useCallback(
    (from: Cell, to: Cell) => {
      if (from[0] === to[0] && from[1] === to[1]) {
        setStart(null)
        setDragEnd(null)
        return
      }
      const line = getLine(from, to)
      if (!line) {
        setShakeCell(to)
        setTimeout(() => setShakeCell(null), 400)
        setStart(null)
        setDragEnd(null)
        return
      }
      const forward = line.map(([r, c]) => puzzle.grid[r][c]).join('')
      const backward = forward.split('').reverse().join('')
      const match = puzzle.words.find((w) => (w === forward || w === backward) && !foundWords.has(w))

      if (match) {
        setFoundWords((prev) => new Set(prev).add(match))
        setFoundCells((prev) => {
          const next = new Set(prev)
          line.forEach((c) => next.add(cellKey(c)))
          return next
        })
      } else {
        setShakeCell(to)
        setTimeout(() => setShakeCell(null), 400)
      }
      setStart(null)
      setDragEnd(null)
    },
    [puzzle, foundWords]
  )

  const handlePointerDown = useCallback(
    (cell: Cell) => {
      if (status !== 'playing') return
      if (!start) {
        setStart(cell)
        setDragEnd(cell)
        setDragging(true)
      } else if (!dragging) {
        evaluateSelection(start, cell)
      }
    },
    [status, start, dragging, evaluateSelection]
  )

  const cellFromPoint = useCallback((x: number, y: number): Cell | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    const r = el?.dataset.row
    const c = el?.dataset.col
    if (r === undefined || c === undefined) return null
    return [parseInt(r), parseInt(c)]
  }, [])

  useEffect(() => {
    if (!dragging) return

    function onMove(e: PointerEvent) {
      if (!start) return
      const cell = cellFromPoint(e.clientX, e.clientY)
      if (cell) {
        const line = getLine(start, cell)
        if (line) setDragEnd(cell)
      }
    }

    function onUp() {
      setDragging(false)
      if (start && dragEnd) {
        evaluateSelection(start, dragEnd)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, start, dragEnd, cellFromPoint, evaluateSelection])

  async function handleShare() {
    const label = mode === 'daily' ? 'Daily' : 'Practice'
    const text = `BOMBANDS Word Search (${label}) — Found all ${puzzle.words.length} words in ${formatTime(elapsed)}! 🎉\nPlay: https://is-project-2026.github.io/bombands-166488/games/wordsearch`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const trailCells = start && dragEnd ? getLine(start, dragEnd) : null
  const trailKeys = new Set((trailCells ?? []).map(cellKey))

  return (
    <main className="flex justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg flex flex-col items-center gap-4 sm:gap-6 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black/40 p-4 sm:p-8 shadow-lg">
        {confettiKey !== null && <ConfettiBurst burstKey={confettiKey} />}

        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Word Search</h1>

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
              onClick={() => {
                const next = getRandomPuzzle(puzzle)
                setPuzzle(next)
                setBestTime(getBestTime(next.theme))
                setStart(null)
                setDragEnd(null)
                setFoundWords(new Set())
                setFoundCells(new Set())
                setStatus('playing')
                setElapsed(0)
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
          <p>
            ⏱ {formatTime(elapsed)}
            {bestTime !== null && <span className="ml-2">🏆 Best: {formatTime(bestTime)}</span>}
          </p>
        </div>

        <div
          ref={gridRef}
          className="grid gap-1 select-none touch-none"
          style={{ gridTemplateColumns: `repeat(${puzzle.grid[0].length}, minmax(0, 1fr))` }}
        >
          {puzzle.grid.flatMap((row, r) =>
            row.map((letter, c) => {
              const key = cellKey([r, c])
              const isFound = foundCells.has(key)
              const isStart = start && start[0] === r && start[1] === c
              const isTrail = trailKeys.has(key)
              const isShaking = shakeCell && shakeCell[0] === r && shakeCell[1] === c
              return (
                <button
                  key={key}
                  data-row={r}
                  data-col={c}
                  onPointerDown={() => handlePointerDown([r, c])}
                  disabled={status !== 'playing'}
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded text-xs sm:text-sm font-bold uppercase border transition ${
                    isShaking ? 'shake' : ''
                  } ${
                    isFound
                      ? 'bg-green-500 text-white border-green-500'
                      : isStart || isTrail
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

        <p className="text-xs text-gray-400 dark:text-gray-600">
          Tap a letter, then drag or tap the last letter of a word
        </p>

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
          <>
            <p className="win-pop text-green-600 dark:text-green-400 font-bold text-lg">
              All found in {formatTime(elapsed)}! 🎉
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