'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const BOARD_SIZE = 11
const RACK_SIZE = 7

const LETTER_VALUES: Record<string, number> = {
  a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5,
  l: 1, m: 3, n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1, u: 1, v: 4,
  w: 4, x: 8, y: 4, z: 10,
}

const LETTER_POOL: string[] = (() => {
  const counts: Record<string, number> = {
    a: 9, b: 2, c: 2, d: 4, e: 12, f: 2, g: 3, h: 2, i: 9, j: 1, k: 1,
    l: 4, m: 2, n: 6, o: 8, p: 2, q: 1, r: 6, s: 4, t: 6, u: 4, v: 2,
    w: 2, x: 1, y: 2, z: 1,
  }
  const pool: string[] = []
  Object.entries(counts).forEach(([letter, count]) => {
    for (let i = 0; i < count; i++) pool.push(letter)
  })
  return pool
})()

function drawTiles(count: number, exclude: string[] = []): string[] {
  const available = [...LETTER_POOL]
  const drawn: string[] = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * available.length)
    drawn.push(available[idx])
    available.splice(idx, 1)
  }
  return drawn
}

type PlacedTile = { row: number; col: number; letter: string; rackIndex: number }
type Cell = [number, number]

const CENTER = Math.floor(BOARD_SIZE / 2)

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

const BEST_SCORE_KEY = 'bombands_scrabble_bestscore'

function getBestScore(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0', 10)
}

function maybeUpdateBestScore(score: number): number {
  const current = getBestScore()
  const best = Math.max(current, score)
  localStorage.setItem(BEST_SCORE_KEY, best.toString())
  return best
}

export default function ScrabblePage() {
  const [rack, setRack] = useState<string[]>([])
  const [board, setBoard] = useState<(PlacedTile | null)[][]>(() =>
    Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null))
  )
  const [selectedRackIndex, setSelectedRackIndex] = useState<number | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([])
  const [message, setMessage] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [bestScore, setBestScore] = useState(0)
  const [confettiKey, setConfettiKey] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [lastWord, setLastWord] = useState<{ word: string; points: number } | null>(null)
  const validatedWordsCache = useRef<Map<string, boolean>>(new Map())
  const confettiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setRack(drawTiles(RACK_SIZE))
    setBestScore(getBestScore())
  }, [])

  const placeTile = useCallback(
    (row: number, col: number) => {
      if (selectedRackIndex === null) return
      if (board[row][col] !== null) return

      const letter = rack[selectedRackIndex]
      const tile: PlacedTile = { row, col, letter, rackIndex: selectedRackIndex }

      setBoard((prev) => {
        const next = prev.map((r) => [...r])
        next[row][col] = tile
        return next
      })
      setPendingTiles((prev) => [...prev, tile])
      setSelectedRackIndex(null)
      setMessage('')
    },
    [selectedRackIndex, rack, board]
  )

  function recallPendingTiles() {
    setBoard((prev) => {
      const next = prev.map((r) => [...r])
      pendingTiles.forEach((t) => {
        next[t.row][t.col] = null
      })
      return next
    })
    setPendingTiles([])
    setMessage('')
  }

  function getPendingWordCells(): Cell[] | null {
    if (pendingTiles.length === 0) return null

    const rows = new Set(pendingTiles.map((t) => t.row))
    const cols = new Set(pendingTiles.map((t) => t.col))
    const horizontal = rows.size === 1
    const vertical = cols.size === 1
    if (!horizontal && !vertical) return null

    if (horizontal) {
      const row = [...rows][0]
      const colsSorted = [...cols].sort((a, b) => a - b)
      const minCol = colsSorted[0]
      const maxCol = colsSorted[colsSorted.length - 1]
      const cells: Cell[] = []
      for (let c = minCol; c <= maxCol; c++) {
        if (!board[row][c]) return null
        cells.push([row, c])
      }
      return cells
    } else {
      const col = [...cols][0]
      const rowsSorted = [...rows].sort((a, b) => a - b)
      const minRow = rowsSorted[0]
      const maxRow = rowsSorted[rowsSorted.length - 1]
      const cells: Cell[] = []
      for (let r = minRow; r <= maxRow; r++) {
        if (!board[r][col]) return null
        cells.push([r, col])
      }
      return cells
    }
  }

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

  async function submitWord() {
    if (pendingTiles.length === 0) {
      setMessage('Place some tiles first')
      return
    }

    const cells = getPendingWordCells()
    if (!cells) {
      setMessage('Tiles must form a single straight line, no gaps')
      return
    }

    const word = cells.map(([r, c]) => board[r][c]!.letter).join('')
    if (word.length < 2) {
      setMessage('Word must be at least 2 letters')
      return
    }

    setIsValidating(true)
    const valid = await isRealWord(word)
    setIsValidating(false)

    if (!valid) {
      setMessage(`"${word.toUpperCase()}" isn't a recognized word`)
      return
    }

    const points = cells.reduce((sum, [r, c]) => sum + LETTER_VALUES[board[r][c]!.letter], 0)
    const bonus = cells.length >= 6 ? 15 : 0 // small bonus for long words, like a real bingo bonus

    const roundScore = points + bonus
    const newTotal = totalScore + roundScore
    setTotalScore(newTotal)
    setLastWord({ word: word.toUpperCase(), points: roundScore })

    const usedIndices = new Set(pendingTiles.map((t) => t.rackIndex))
    const remaining = rack.filter((_, i) => !usedIndices.has(i))
    const newTiles = drawTiles(pendingTiles.length)
    setRack([...remaining, ...newTiles])

    setPendingTiles([])
    setMessage('')

    const best = maybeUpdateBestScore(newTotal)
    setBestScore(best)

    if (confettiTimeout.current) clearTimeout(confettiTimeout.current)
    setConfettiKey(Date.now())
    confettiTimeout.current = setTimeout(() => setConfettiKey(null), 4000)
  }

  function newRound() {
    setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)))
    setRack(drawTiles(RACK_SIZE))
    setTotalScore(0)
    setPendingTiles([])
    setMessage('')
    setLastWord(null)
  }

  async function handleShare() {
    const text = `BOMBANDS Scrabble — Scored ${totalScore} points! 🔤\nPlay: https://is-project-2026.github.io/bombands-166488/games/scrabble`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="flex justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl flex flex-col items-center gap-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black/40 p-4 sm:p-8 shadow-lg">
        {confettiKey !== null && <ConfettiBurst burstKey={confettiKey} />}

        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Scrabble</h1>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Score: <span className="font-bold text-gray-900 dark:text-white">{totalScore}</span></p>
          <p>🏆 Best: {bestScore}</p>
          <button
            onClick={newRound}
            className="px-3 py-1.5 rounded bg-blue-500 text-white text-xs transition active:scale-95 hover:brightness-110"
          >
            New round
          </button>
        </div>

        {lastWord && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Last word: {lastWord.word} (+{lastWord.points})
          </p>
        )}

        <div
          className="grid gap-0.5 select-none"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
        >
          {board.flatMap((row, r) =>
            row.map((tile, c) => {
              const isCenter = r === CENTER && c === CENTER
              const isPending = pendingTiles.some((t) => t.row === r && t.col === c)
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => placeTile(r, c)}
                  disabled={tile !== null}
                  className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center relative text-[10px] sm:text-xs font-bold uppercase border transition ${
                    tile
                      ? isPending
                        ? 'bg-amber-400 border-amber-500 text-amber-950'
                        : 'bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                      : isCenter
                      ? 'bg-blue-100 dark:bg-blue-900/40 border-gray-300 dark:border-gray-700 hover:brightness-110'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:brightness-95 dark:hover:brightness-125'
                  }`}
                >
                  {tile ? (
                    <>
                      {tile.letter}
                      <span className="absolute bottom-0 right-0.5 text-[6px] sm:text-[7px] font-normal">
                        {LETTER_VALUES[tile.letter]}
                      </span>
                    </>
                  ) : isCenter ? (
                    '★'
                  ) : (
                    ''
                  )}
                </button>
              )
            })
          )}
        </div>

        {message && <p className="text-red-500 text-sm">{message}</p>}
        {isValidating && <p className="text-gray-500 dark:text-gray-400 text-sm">Checking word...</p>}

        <div className="flex gap-2">
          <button
            onClick={submitWord}
            disabled={pendingTiles.length === 0 || isValidating}
            className="px-4 py-2 rounded bg-green-600 text-white font-semibold transition active:scale-95 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit word
          </button>
          <button
            onClick={recallPendingTiles}
            disabled={pendingTiles.length === 0}
            className="px-4 py-2 rounded bg-gray-500 text-white font-semibold transition active:scale-95 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Recall tiles
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-white dark:text-black font-semibold transition active:scale-95 hover:brightness-110"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap justify-center mt-2">
          {rack.map((letter, i) => (
            <button
              key={i}
              onClick={() => setSelectedRackIndex(selectedRackIndex === i ? null : i)}
              className={`relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg text-lg sm:text-xl font-bold uppercase border-2 shadow-md transition active:scale-90 ${
                selectedRackIndex === i
                  ? 'bg-blue-400 border-blue-600 text-white scale-110'
                  : 'bg-amber-100 dark:bg-amber-900/70 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:brightness-105'
              }`}
            >
              {letter}
              <span className="absolute bottom-0.5 right-1 text-[9px] font-normal">
                {LETTER_VALUES[letter]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600">
          Tap a tile, then tap a board square. Place letters in one straight line, then submit.
        </p>
      </div>
    </main>
  )
}