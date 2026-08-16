'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type WordEntry = { word: string; clue: string }
type Placement = WordEntry & { row: number; col: number; dir: 'across' | 'down' }

const WORD_BANK: WordEntry[] = [
  { word: 'REACT', clue: 'JS library for building UIs' },
  { word: 'GITHUB', clue: 'Where BOMBANDS lives' },
  { word: 'SUPABASE', clue: 'Backend used for auth here' },
  { word: 'COMMIT', clue: 'A saved snapshot in git' },
  { word: 'BRANCH', clue: 'Isolated line of development in git' },
  { word: 'MERGE', clue: 'Combining two branches' },
  { word: 'SUDOKU', clue: 'Number puzzle, also a BOMBANDS game' },
  { word: 'WORDLE', clue: 'Guess the five letter word game' },
  { word: 'HANGMAN', clue: 'Guess letters before the drawing completes' },
  { word: 'SCRABBLE', clue: 'Tile based word game' },
  { word: 'DEBUG', clue: 'Find and fix errors in code' },
  { word: 'ARRAY', clue: 'Ordered collection data structure' },
  { word: 'VERCEL', clue: 'Where the Next.js app deploys' },
  { word: 'DEPLOY', clue: 'Publish your app to a live server' },
  { word: 'FETCH', clue: 'Download changes without merging' },
]

const SIZE = 20

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function emptyGrid(): (string | null)[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
}
function inBounds(r: number, c: number) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE
}

function canPlace(grid: (string | null)[][], word: string, row: number, col: number, dir: 'across' | 'down') {
  const dr = dir === 'down' ? 1 : 0
  const dc = dir === 'across' ? 1 : 0
  const br = row - dr, bc = col - dc
  if (inBounds(br, bc) && grid[br][bc] !== null) return false
  const ar = row + dr * word.length, ac = col + dc * word.length
  if (inBounds(ar, ac) && grid[ar][ac] !== null) return false

  let hasIntersection = false
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i, c = col + dc * i
    if (!inBounds(r, c)) return false
    const existing = grid[r][c]
    if (existing !== null) {
      if (existing !== word[i]) return false
      hasIntersection = true
    } else if (dir === 'across') {
      if (inBounds(r - 1, c) && grid[r - 1][c] !== null) return false
      if (inBounds(r + 1, c) && grid[r + 1][c] !== null) return false
    } else {
      if (inBounds(r, c - 1) && grid[r][c - 1] !== null) return false
      if (inBounds(r, c + 1) && grid[r][c + 1] !== null) return false
    }
  }
  return hasIntersection
}

function place(grid: (string | null)[][], word: string, row: number, col: number, dir: 'across' | 'down') {
  const dr = dir === 'down' ? 1 : 0
  const dc = dir === 'across' ? 1 : 0
  for (let i = 0; i < word.length; i++) grid[row + dr * i][col + dc * i] = word[i]
}

function attemptGenerate(words: WordEntry[], rng: () => number) {
  const grid = emptyGrid()
  const list = [...words].sort((a, b) => b.word.length - a.word.length)
  const placed: Placement[] = []

  const first = list[0]
  const startR = Math.floor(SIZE / 2)
  const startC = Math.floor(SIZE / 2 - first.word.length / 2)
  place(grid, first.word, startR, startC, 'across')
  placed.push({ ...first, row: startR, col: startC, dir: 'across' })

  for (let i = 1; i < list.length; i++) {
    const w = list[i]
    const candidates: { row: number; col: number; dir: 'across' | 'down' }[] = []
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const letter = grid[r][c]
        if (letter === null) continue
        for (let li = 0; li < w.word.length; li++) {
          if (w.word[li] !== letter) continue
          const acrossRow = r, acrossCol = c - li
          if (canPlace(grid, w.word, acrossRow, acrossCol, 'across'))
            candidates.push({ row: acrossRow, col: acrossCol, dir: 'across' })
          const downRow = r - li, downCol = c
          if (canPlace(grid, w.word, downRow, downCol, 'down'))
            candidates.push({ row: downRow, col: downCol, dir: 'down' })
        }
      }
    }
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(rng() * candidates.length)]
      place(grid, w.word, pick.row, pick.col, pick.dir)
      placed.push({ ...w, row: pick.row, col: pick.col, dir: pick.dir })
    }
  }
  return { grid, placed }
}

function generateCrossword(rng: () => number) {
  const shuffled = seededShuffle(WORD_BANK, rng).slice(0, 9)
  let best: { grid: (string | null)[][]; placed: Placement[] } | null = null
  for (let attempt = 0; attempt < 6; attempt++) {
    const result = attemptGenerate(shuffled, rng)
    if (!best || result.placed.length > best.placed.length) best = result
  }
  return best!
}

function computeBounds(grid: (string | null)[][]) {
  let minR = SIZE, maxR = -1, minC = SIZE, maxC = -1
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== null) {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r)
        minC = Math.min(minC, c); maxC = Math.max(maxC, c)
      }
    }
  }
  return { minR, maxR, minC, maxC }
}

function buildNumbers(grid: (string | null)[][], b: ReturnType<typeof computeBounds>) {
  const rows = b.maxR - b.minR + 1, cols = b.maxC - b.minC + 1
  const numbers: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
  let n = 1
  for (let r = b.minR; r <= b.maxR; r++) {
    for (let c = b.minC; c <= b.maxC; c++) {
      if (grid[r][c] === null) continue
      const leftEmpty = !inBounds(r, c - 1) || grid[r][c - 1] === null
      const rightFull = inBounds(r, c + 1) && grid[r][c + 1] !== null
      const upEmpty = !inBounds(r - 1, c) || grid[r - 1][c] === null
      const downFull = inBounds(r + 1, c) && grid[r + 1][c] !== null
      if ((leftEmpty && rightFull) || (upEmpty && downFull)) {
        numbers[r - b.minR][c - b.minC] = n
        n++
      }
    }
  }
  return numbers
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

const MAX_HINTS = 3

export default function CrosswordPage() {
  const [mode, setMode] = useState<'daily' | 'practice'>('daily')
  const [solution, setSolution] = useState<(string | null)[][]>([])
  const [placements, setPlacements] = useState<Placement[]>([])
  const [bounds, setBounds] = useState({ minR: 0, maxR: 0, minC: 0, maxC: 0 })
  const [numbers, setNumbers] = useState<(number | null)[][]>([])
  const [userGrid, setUserGrid] = useState<(string | null)[][]>([])
  const [status, setStatus] = useState<'playing' | 'won'>('playing')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [checkResult, setCheckResult] = useState<Set<string> | null>(null)
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastWinDate: null })
  const [confettiKey, setConfettiKey] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [copied, setCopied] = useState(false)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const confettiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setStreak(getStreak())
  }, [])

  const newPuzzle = useCallback((useDaily: boolean) => {
    const seed = useDaily ? Math.floor(Date.now() / 86400000) : Math.floor(Math.random() * 1e9)
    const rng = mulberry32(seed)
    const gen = generateCrossword(rng)
    const b = computeBounds(gen.grid)
    const rows = b.maxR - b.minR + 1, cols = b.maxC - b.minC + 1
    setSolution(gen.grid)
    setPlacements(gen.placed)
    setBounds(b)
    setNumbers(buildNumbers(gen.grid, b))
    setUserGrid(Array.from({ length: rows }, () => Array(cols).fill(null)))
    setStatus('playing')
    setHintsUsed(0)
    setCheckResult(null)
    setElapsed(0)
  }, [])

  useEffect(() => {
    newPuzzle(mode === 'daily')
  }, [mode, newPuzzle])

  useEffect(() => {
    if (status !== 'playing') return
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [status, solution])

  useEffect(() => {
    if (solution.length === 0 || userGrid.length === 0) return
    const rows = bounds.maxR - bounds.minR + 1, cols = bounds.maxC - bounds.minC + 1
    let complete = true
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const correct = solution[r + bounds.minR]?.[c + bounds.minC]
        if (correct === null || correct === undefined) continue
        if (userGrid[r]?.[c] !== correct) {
          complete = false
        }
      }
    }
    if (complete) setStatus('won')
  }, [userGrid, solution, bounds])

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

  function handleInput(r: number, c: number, raw: string) {
    if (status !== 'playing') return
    const v = raw.toUpperCase().replace(/[^A-Z]/, '')
    setUserGrid((prev) => {
      const next = prev.map((row) => [...row])
      next[r][c] = v || null
      return next
    })
    setCheckResult(null)
    if (v) {
      const cols = bounds.maxC - bounds.minC + 1
      for (let cc = c + 1; cc < cols; cc++) {
        const el = inputRefs.current[`${r}-${cc}`]
        if (el) { el.focus(); break }
      }
    }
  }

  function handleKeyDown(r: number, c: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !userGrid[r]?.[c]) {
      for (let cc = c - 1; cc >= 0; cc--) {
        const el = inputRefs.current[`${r}-${cc}`]
        if (el) { el.focus(); break }
      }
    }
  }

  function handleCheck() {
    const rows = bounds.maxR - bounds.minR + 1, cols = bounds.maxC - bounds.minC + 1
    const wrong = new Set<string>()
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const correct = solution[r + bounds.minR]?.[c + bounds.minC]
        if (correct === null || correct === undefined) continue
        if (userGrid[r]?.[c] && userGrid[r][c] !== correct) wrong.add(`${r}-${c}`)
      }
    }
    setCheckResult(wrong)
  }

  function useHint() {
    if (status !== 'playing' || hintsUsed >= MAX_HINTS) return
    const rows = bounds.maxR - bounds.minR + 1, cols = bounds.maxC - bounds.minC + 1
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const correct = solution[r + bounds.minR]?.[c + bounds.minC]
        if (correct && userGrid[r]?.[c] !== correct) {
          setUserGrid((prev) => {
            const next = prev.map((row) => [...row])
            next[r][c] = correct
            return next
          })
          setHintsUsed((h) => h + 1)
          return
        }
      }
    }
  }

  async function handleShare() {
    const label = mode === 'daily' ? 'Daily' : 'Practice'
    const text = `BOMBANDS Crossword (${label}) — Solved in ${formatTime(elapsed)}! 🎉\nPlay: https://is-project-2026.github.io/bombands-166488/games/crossword`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const acrossClues = placements
    .filter((p) => p.dir === 'across')
    .map((p) => ({ n: numbers[p.row - bounds.minR]?.[p.col - bounds.minC], clue: p.clue }))
    .sort((a, b) => (a.n ?? 0) - (b.n ?? 0))
  const downClues = placements
    .filter((p) => p.dir === 'down')
    .map((p) => ({ n: numbers[p.row - bounds.minR]?.[p.col - bounds.minC], clue: p.clue }))
    .sort((a, b) => (a.n ?? 0) - (b.n ?? 0))

  const rows = bounds.maxR - bounds.minR + 1
  const cols = bounds.maxC - bounds.minC + 1

  return (
    <main className="flex justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl flex flex-col items-center gap-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black/40 p-4 sm:p-8 shadow-lg">
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
          {mode === 'practice' && (
            <button
              onClick={() => newPuzzle(false)}
              className="px-4 py-2 rounded bg-blue-500 text-white transition active:scale-95 hover:brightness-110"
            >
              New puzzle
            </button>
          )}
          {status === 'playing' && (
            <>
              <button
                onClick={handleCheck}
                className="px-4 py-2 rounded bg-gray-500 text-white transition active:scale-95 hover:brightness-110"
              >
                ✓ Check
              </button>
              <button
                onClick={useHint}
                disabled={hintsUsed >= MAX_HINTS}
                className="px-4 py-2 rounded bg-amber-500 text-white transition active:scale-95 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                💡 Hint ({MAX_HINTS - hintsUsed})
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          {mode === 'daily' && <p>🔥 Streak: {streak.count}</p>}
          <p>⏱ {formatTime(elapsed)}</p>
        </div>

        {status === 'won' && (
          <p className="win-pop text-green-600 dark:text-green-400 font-bold text-lg">
            Solved in {formatTime(elapsed)}! 🎉
          </p>
        )}

        <div className="flex gap-6 flex-wrap justify-center w-full">
          <div
            className="inline-grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${cols}, 26px)`, gridTemplateRows: `repeat(${rows}, 26px)` }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const letter = solution[r + bounds.minR]?.[c + bounds.minC]
                if (letter === null || letter === undefined) {
                  return <div key={`${r}-${c}`} className="bg-gray-900 dark:bg-black" />
                }
                const num = numbers[r]?.[c]
                const isWrong = checkResult?.has(`${r}-${c}`)
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`relative border ${
                      isWrong
                        ? 'border-red-500 bg-red-100 dark:bg-red-900/40'
                        : status === 'won'
                        ? 'border-green-400 bg-green-100 dark:bg-green-900/40'
                        : 'border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900'
                    }`}
                  >
                    {num && (
                      <span className="absolute top-0 left-0.5 text-[8px] text-gray-500 dark:text-gray-400">
                        {num}
                      </span>
                    )}
                    <input
                      ref={(el) => { inputRefs.current[`${r}-${c}`] = el }}
                      maxLength={1}
                      value={userGrid[r]?.[c] ?? ''}
                      onChange={(e) => handleInput(r, c, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(r, c, e)}
                      disabled={status !== 'playing'}
                      className="w-full h-full text-center font-medium uppercase bg-transparent outline-none text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                )
              })
            )}
          </div>

          <div className="flex gap-6 flex-1 min-w-[180px] text-gray-700 dark:text-gray-300">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Across</div>
              {acrossClues.map((i, idx) => (
                <div key={idx} className="text-xs mb-1">{i.n}. {i.clue}</div>
              ))}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Down</div>
              {downClues.map((i, idx) => (
                <div key={idx} className="text-xs mb-1">{i.n}. {i.clue}</div>
              ))}
            </div>
          </div>
        </div>

        {status === 'won' && (
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-white dark:text-black font-semibold transition active:scale-95 hover:brightness-110"
          >
            {copied ? 'Copied!' : 'Share Results'}
          </button>
        )}
      </div>
    </main>
  )
}