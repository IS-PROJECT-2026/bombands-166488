'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

type Board = (number | null)[][]
type NotesBoard = Set<number>[][]
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

const SIZE = 9
const BOX = 3

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
  const [isComplete, setIsComplete] = useState(false)
  const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set())

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
    setIsComplete(false)
    setInvalidCells(new Set())
  }, [])

  useEffect(() => {
    newGame(difficulty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isRunning || isComplete) return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [isRunning, isComplete])

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
    setSelected([row, col])
  }

  const handleNumberInput = (num: number) => {
    if (!selected || isComplete) return
    const [row, col] = selected
    if (puzzle[row][col] !== null) return // can't edit given clues

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

    // clear notes in this cell when filling a value
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
      setMistakes((m) => m + 1)
    } else if (checkComplete(newBoard)) {
      setIsComplete(true)
      setIsRunning(false)
    }
  }

  const handleErase = () => {
    if (!selected) return
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
    if (!selected || isComplete) return
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
      setIsComplete(true)
      setIsRunning(false)
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selected) return
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
  }, [selected, board, noteMode, isComplete])

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
    <main className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">🔢 Sudoku</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono">{formatTime(seconds)}</span>
          <span className="text-red-500">Mistakes: {mistakes}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => {
              setDifficulty(d)
              newGame(d)
            }}
            className={`px-3 py-1 rounded-full text-sm capitalize border transition ${
              difficulty === d
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => newGame(difficulty)}
          className="ml-auto px-3 py-1 rounded-full text-sm border border-gray-300 hover:bg-gray-50"
        >
          New game
        </button>
      </div>

      {isComplete && (
        <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 text-center font-medium">
          🎉 Solved in {formatTime(seconds)} with {mistakes} mistake{mistakes !== 1 ? 's' : ''}!
        </div>
      )}

      <div className="grid grid-cols-9 border-2 border-gray-800 w-full aspect-square select-none">
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

            const borderRight = (c + 1) % BOX === 0 && c !== SIZE - 1 ? 'border-r-2 border-r-gray-800' : 'border-r border-r-gray-300'
            const borderBottom = (r + 1) % BOX === 0 && r !== SIZE - 1 ? 'border-b-2 border-b-gray-800' : 'border-b border-b-gray-300'

            let bg = 'bg-white'
            if (isSelected) bg = 'bg-blue-200'
            else if (isSameValue) bg = 'bg-blue-100'
            else if (isSameRowCol || isSameBox) bg = 'bg-gray-100'

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleSelect(r, c)}
                className={`relative aspect-square flex items-center justify-center text-lg sm:text-xl font-medium transition-colors ${borderRight} ${borderBottom} ${bg} ${
                  isGiven ? 'text-gray-900 font-bold' : isInvalid ? 'text-red-600' : 'text-blue-700'
                }`}
              >
                {cell !== null ? (
                  cell
                ) : notes[r][c].size > 0 ? (
                  <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5 text-[8px] sm:text-[10px] text-gray-500 leading-none">
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

      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={() => setNoteMode((v) => !v)}
          className={`px-3 py-2 rounded-lg text-sm border transition ${
            noteMode ? 'bg-yellow-400 border-yellow-500 text-black' : 'bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          ✏️ Notes {noteMode ? 'On' : 'Off'}
        </button>
        <button
          onClick={handleErase}
          className="px-3 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
        >
          ⌫ Erase
        </button>
        <button
          onClick={handleHint}
          className="px-3 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
        >
          💡 Hint
        </button>
      </div>

      <div className="grid grid-cols-9 gap-1 mt-4">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            disabled={numberCounts[num] >= 9}
            className="aspect-square rounded-lg border border-gray-300 text-lg font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {num}
          </button>
        ))}
      </div>
    </main>
  )
}