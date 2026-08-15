'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

type Board = (number | null)[][]
type NotesBoard = Set<number>[][]
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'
type Status = 'playing' | 'won' | 'lost'

const SIZE = 9
const BOX = 3
const MAX_MISTAKES = 5

const CLUES: Record<Difficulty, number> = {
  easy: 46,
  medium: 38,
  hard: 30,
  expert: 24,
}

// ---------- Sudoku generation ----------

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row])
}

function isValidPlacement(board: Board, row: number, col: number, num: number): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (board[row][i] === num) return false
    if (board[i][col] === num) return false
  }
  const boxRow = Math.floor(row / BOX) * BOX
  const boxCol = Math.floor(col / BOX) * BOX
  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) {
      if (board[boxRow + r][boxCol + c] === num) return false
    }
  }
  return true
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function fillBoard(board: Board): boolean {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === null) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const num of nums) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num
            if (fillBoard(board)) return true
            board[row][col] = null
          }
        }
        return false
      }
    }
  }
  return true
}

function countSolutions(board: Board, limit = 2): number {
  let count = 0

  function solve(b: Board): boolean {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (b[row][col] === null) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(b, row, col, num)) {
              b[row][col] = num
              if (solve(b)) {
                // keep going to find more, unless limit hit
              }
              b[row][col] = null
            }
          }
          return false
        }
      }
    }
    count++
    return count >= limit
  }

  const copy = cloneBoard(board)
  solve(copy)
  return count
}

function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  const solved = emptyBoard()
  fillBoard(solved)
  const solution = cloneBoard(solved)
  const puzzle = cloneBoard(solved)

  const cells = shuffle(
    Array.from({ length: SIZE * SIZE }, (_, i) => [Math.floor(i / SIZE), i % SIZE] as [number, number])
  )

  const clueTarget = CLUES[difficulty]
  let filled = SIZE * SIZE

  for (const [row, col] of cells) {
    if (filled <= clueTarget) break
    const backup = puzzle[row][col]
    puzzle[row][col] = null

    const solutions = countSolutions(puzzle, 2)
    if (solutions !== 1) {
      puzzle[row][col] = backup
    } else {
      filled--
    }
  }

  return { puzzle, solution }
}

function emptyNotes(): NotesBoard {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => new Set<number>()))
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ---------- Confetti (shared pattern with other games) ----------

const CONFETTI_EMOJIS = ['🎉', '🎊', '✨', '⭐', '🎈']
const LOSS_EMOJIS = ['💀', '😵', '🔴']

function EmojiBurst({ burstKey, emojis }: { burstKey: number; emojis: string[] }) {
  const pieces = Array.from({ length: 250 })
  return (
    <div key={burstKey} className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {pieces.map((_, i) => {
        const emoji = emojis[i % emojis.length]
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

// ---------- Streak (daily only) ----------

const STREAK_KEY = 'bombands_sudoku_streak'
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

// ---------- Component ----------

export default function SudokuPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [puzzle, setPuzzle] = useState<Board>(() => emptyBoard())
  const [solution, setSolution] = useState<Board>(() => emptyBoard())
  const [board, setBoard] = useState<Board>(() => emptyBoard())
  const [notes, setNotes] = useState<NotesBoard>(() => emptyNotes())
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [noteMode, setNoteMode] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const [status, setStatus] = useState<Status>('playing')
  const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set())
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastWinDate: null })
  const [confettiKey, setConfettiKey] = useState<number | null>(null)
  const [lossKey, setLossKey] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const confettiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lossTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setStreak(getStreak())
  }, [])

  const newGame = useCallback((diff: Difficulty) => {
    const { puzzle: p, solution: s } = generatePuzzle(diff)
    setPuzzle(p)
    setSolution(s)
    setBoard(cloneBoard(p))
    setNotes(emptyNotes())
    setSelected(null)
    setNoteMode(false)
    setMistakes(0)
    setSeconds(0)
    setIsRunning(true)
    setStatus('playing')
    setInvalidCells(new Set())
  }, [])

  useEffect(() => {
    newGame(difficulty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isRunning || status !== 'playing') return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [isRunning, status])

  useEffect(() => {
    if (status === 'won') {
      setStreak(updateStreak(true))
      if (confettiTimeout.current) clearTimeout(confettiTimeout.current)
      setConfettiKey(Date.now())
      confettiTimeout.current = setTimeout(() => setConfettiKey(null), 8000)
    }
    if (status === 'lost') {
      setStreak(updateStreak(false))
      if (lossTimeout.current) clearTimeout(lossTimeout.current)
      setLossKey(Date.now())
      lossTimeout.current = setTimeout(() => setLossKey(null), 8000)
    }
    return () => {
      if (confettiTimeout.current) clearTimeout(confettiTimeout.current)
      if (lossTimeout.current) clearTimeout(lossTimeout.current)
    }
  }, [status])

  const checkComplete = useCallback(
    (b: Board) => {
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (b[r][c] !== solution[r][c]) return false
        }
      }
      return true
    },
    [solution]
  )

  const handleSelect = (row: number, col: number) => {
    if (status !== 'playing') return
    setSelected([row, col])
  }

  const handleNumberInput = (num: number) => {
    if (!selected || status !== 'playing') return
    const [row, col] = selected
    if (puzzle[row][col] !== null) return

    if (noteMode) {
      setNotes((prev) => {
        const next = prev.map((r) => r.map((s) => new Set(s)))
        const cellNotes = next[row][col]
        if (cellNotes.has(num)) {
          cellNotes.delete(num)
        } else {
          cellNotes.add(num)
        }
        return next
      })
      return
    }

    const newBoard = cloneBoard(board)
    newBoard[row][col] = num
    setBoard(newBoard)

    setNotes((prev) => {
      const next = prev.map((r) => r.map((s) => new Set(s)))
      next[row][col].clear()
      return next
    })

    const correct = solution[row][col] === num
    const key = `${row}-${col}`
    setInvalidCells((prev) => {
      const next = new Set(prev)
      if (correct) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })

    if (!correct) {
      const newMistakes = mistakes + 1
      setMistakes(newMistakes)
      if (newMistakes >= MAX_MISTAKES) {
        setStatus('lost')
      }
    } else if (checkComplete(newBoard)) {
      setStatus('won')
    }
  }

  const handleErase = () => {
    if (!selected || status !== 'playing') return
    const [row, col] = selected
    if (puzzle[row][col] !== null) return

    const newBoard = cloneBoard(board)
    newBoard[row][col] = null
    setBoard(newBoard)

    setNotes((prev) => {
      const next = prev.map((r) => r.map((s) => new Set(s)))
      next[row][col].clear()
      return next
    })

    setInvalidCells((prev) => {
      const next = new Set(prev)
      next.delete(`${row}-${col}`)
      return next
    })
  }

  const handleHint = () => {
    if (!selected || status !== 'playing') return
    const [row, col] = selected
    if (puzzle[row][col] !== null) return

    const newBoard = cloneBoard(board)
    newBoard[row][col] = solution[row][col]
    setBoard(newBoard)

    setNotes((prev) => {
      const next = prev.map((r) => r.map((s) => new Set(s)))
      next[row][col].clear()
      return next
    })

    setInvalidCells((prev) => {
      const next = new Set(prev)
      next.delete(`${row}-${col}`)
      return next
    })

    if (checkComplete(newBoard)) {
      setStatus('won')
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selected || status !== 'playing') return
      const [row, col] = selected
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key, 10))
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleErase()
      } else if (e.key === 'ArrowUp') {
        setSelected([Math.max(0, row - 1), col])
      } else if (e.key === 'ArrowDown') {
        setSelected([Math.min(SIZE - 1, row + 1), col])
      } else if (e.key === 'ArrowLeft') {
        setSelected([row, Math.max(0, col - 1)])
      } else if (e.key === 'ArrowRight') {
        setSelected([row, Math.min(SIZE - 1, col + 1)])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, board, noteMode, status])

  async function handleShare() {
    const text =
      status === 'won'
        ? `BOMBANDS Sudoku (${difficulty}) — Solved in ${formatTime(seconds)} with ${mistakes} mistake${mistakes === 1 ? '' : 's'}! 🎉\nPlay: https://is-project-2026.github.io/bombands-166488/games/sudoku`
        : `BOMBANDS Sudoku (${difficulty}) — Ran out of chances at ${MAX_MISTAKES} mistakes 💀\nPlay: https://is-project-2026.github.io/bombands-166488/games/sudoku`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedValue = selected ? board[selected[0]][selected[1]] : null

  const numberCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (let n = 1; n <= 9; n++) counts[n] = 0
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = board[r][c]
        if (v) counts[v]++
      }
    }
    return counts
  }, [board])

  return (
    <main className="flex justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl flex flex-col items-center gap-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black/40 p-4 sm:p-8 shadow-lg">
        {confettiKey !== null && <EmojiBurst burstKey={confettiKey} emojis={CONFETTI_EMOJIS} />}
        {lossKey !== null && <EmojiBurst burstKey={lossKey} emojis={LOSS_EMOJIS} />}

        <div className="w-full flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">🔢 Sudoku</h1>
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-mono">{formatTime(seconds)}</span>
            <span className={mistakes >= MAX_MISTAKES - 1 ? 'text-red-500 font-semibold' : 'text-red-500'}>
              Mistakes: {mistakes}/{MAX_MISTAKES}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">🔥 Daily streak: {streak.count}</p>

        <div className="w-full flex flex-wrap items-center gap-2">
          {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d)
                newGame(d)
              }}
              className={`px-3 py-1 rounded-full text-sm capitalize border transition active:scale-95 hover:brightness-110 ${
                difficulty === d
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => newGame(difficulty)}
            className="ml-auto px-3 py-1 rounded-full text-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95"
          >
            New game
          </button>
        </div>

        {status === 'won' && (
          <div className="win-pop w-full p-3 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-center font-medium">
            🎉 Solved in {formatTime(seconds)} with {mistakes} mistake{mistakes !== 1 ? 's' : ''}!
          </div>
        )}
        {status === 'lost' && (
          <div className="win-pop w-full p-3 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-center font-medium">
            💀 Out of chances — {MAX_MISTAKES} mistakes reached. The board is locked.
          </div>
        )}
        {(status === 'won' || status === 'lost') && (
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-white dark:text-black font-semibold transition active:scale-95 hover:brightness-110"
          >
            {copied ? 'Copied!' : 'Share Results'}
          </button>
        )}

        <div className="grid grid-cols-9 border-2 border-gray-800 dark:border-gray-300 w-full aspect-square select-none">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isGiven = puzzle[r][c] !== null
              const isSelected = selected?.[0] === r && selected?.[1] === c
              const isSameRowCol = selected && (selected[0] === r || selected[1] === c)
              const isSameBox =
                selected &&
                Math.floor(selected[0] / BOX) === Math.floor(r / BOX) &&
                Math.floor(selected[1] / BOX) === Math.floor(c / BOX)
              const isSameValue = selectedValue !== null && cell === selectedValue
              const isInvalid = invalidCells.has(`${r}-${c}`)

              const borderRight =
                (c + 1) % BOX === 0 && c !== SIZE - 1
                  ? 'border-r-2 border-r-gray-800 dark:border-r-gray-300'
                  : 'border-r border-r-gray-300 dark:border-r-gray-700'
              const borderBottom =
                (r + 1) % BOX === 0 && r !== SIZE - 1
                  ? 'border-b-2 border-b-gray-800 dark:border-b-gray-300'
                  : 'border-b border-b-gray-300 dark:border-b-gray-700'

              let bg = 'bg-white dark:bg-gray-900'
              if (isSelected) bg = 'bg-blue-200 dark:bg-blue-900/60'
              else if (isSameValue) bg = 'bg-blue-100 dark:bg-blue-900/30'
              else if (isSameRowCol || isSameBox) bg = 'bg-gray-100 dark:bg-gray-800'

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleSelect(r, c)}
                  disabled={status !== 'playing'}
                  className={`relative aspect-square flex items-center justify-center text-lg sm:text-xl font-medium transition-colors ${borderRight} ${borderBottom} ${bg} ${
                    isGiven
                      ? 'text-gray-900 dark:text-white font-bold'
                      : isInvalid
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {cell !== null ? (
                    cell
                  ) : notes[r][c].size > 0 ? (
                    <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5 text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 leading-none">
                      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                        <div key={n} className="flex items-center justify-center">
                          {notes[r][c].has(n) ? n : ''}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </button>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setNoteMode((v) => !v)}
            disabled={status !== 'playing'}
            className={`px-3 py-2 rounded-lg text-sm border transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              noteMode
                ? 'bg-yellow-400 border-yellow-500 text-black'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            ✏️ Notes {noteMode ? 'On' : 'Off'}
          </button>
          <button
            onClick={handleErase}
            disabled={status !== 'playing'}
            className="px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⌫ Erase
          </button>
          <button
            onClick={handleHint}
            disabled={status !== 'playing'}
            className="px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            💡 Hint
          </button>
        </div>

        <div className="grid grid-cols-9 gap-1 w-full">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              disabled={numberCounts[num] >= 9 || status !== 'playing'}
              className="aspect-square rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}