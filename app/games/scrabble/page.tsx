'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const BOARD_SIZE = 11
const RACK_SIZE = 7
const CENTER = Math.floor(BOARD_SIZE / 2)

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

function drawTiles(count: number): string[] {
  const available = [...LETTER_POOL]
  const drawn: string[] = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * available.length)
    drawn.push(available[idx])
    available.splice(idx, 1)
  }
  return drawn
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type PlacedTile = { row: number; col: number; letter: string; rackIndex: number }
type Cell = [number, number]
type BonusType = 'TW' | 'DW' | 'TL' | 'DL'

const BONUS: Record<string, BonusType> = {}
;[[0, 0], [0, 10], [10, 0], [10, 10]].forEach(([r, c]) => (BONUS[`${r}-${c}`] = 'TW'))
;[
  [1, 1], [2, 2], [3, 3], [4, 4], [6, 6], [7, 7], [8, 8], [9, 9],
  [1, 9], [2, 8], [3, 7], [4, 6], [6, 4], [7, 3], [8, 2], [9, 1],
  [5, 5],
].forEach(([r, c]) => (BONUS[`${r}-${c}`] = 'DW'))
;[[0, 5], [5, 0], [5, 10], [10, 5]].forEach(([r, c]) => (BONUS[`${r}-${c}`] = 'TL'))
;[[2, 6], [6, 2], [2, 4], [4, 2], [6, 8], [8, 6], [4, 8], [8, 4]].forEach(
  ([r, c]) => (BONUS[`${r}-${c}`] = 'DL')
)

const BONUS_STYLES: Record<BonusType, string> = {
  TW: 'bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  DW: 'bg-pink-200 dark:bg-pink-900/40 text-pink-700 dark:text-pink-400',
  TL: 'bg-blue-200 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  DL: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
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

const BEST_SCORE_KEY = 'bombands_scrabble_bestscore'

function getBestScore(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0', 10)
}

function maybeUpdateBestScore(score: number): number {
  const best = Math.max(getBestScore(), score)
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

  const usedRackIndices = new Set(pendingTiles.map((t) => t.rackIndex))

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

  function shuffleRack() {
    if (pendingTiles.length > 0) return
    setRack((prev) => shuffleArray(prev))
  }

  function computeWordCells(): Cell[] | null {
    if (pendingTiles.length === 0) return null

    const rows = new Set(pendingTiles.map((t) => t.row))
    const cols = new Set(pendingTiles.map((t) => t.col))

    let direction: 'h' | 'v'
    if (pendingTiles.length > 1) {
      if (rows.size === 1) direction = 'h'
      else if (cols.size === 1) direction = 'v'
      else return null
    } else {
      const t = pendingTiles[0]
      const hasHorizNeighbor = board[t.row][t.col - 1] || board[t.row][t.col + 1]
      direction = hasHorizNeighbor ? 'h' : 'v'
    }

    if (direction === 'h') {
      const row = pendingTiles[0].row
      let minCol = Math.min(...pendingTiles.map((t) => t.col))
      let maxCol = Math.max(...pendingTiles.map((t) => t.col))
      while (minCol > 0 && board[row][minCol - 1]) minCol--
      while (maxCol < BOARD_SIZE - 1 && board[row][maxCol + 1]) maxCol++
      const cells: Cell[] = []
      for (let c = minCol; c <= maxCol; c++) {
        if (!board[row][c]) return null
        cells.push([row, c])
      }
      return cells
    } else {
      const col = pendingTiles[0].col
      let minRow = Math.min(...pendingTiles.map((t) => t.row))
      let maxRow = Math.max(...pendingTiles.map((t) => t.row))
      while (minRow > 0 && board[minRow - 1][col]) minRow--
      while (maxRow < BOARD_SIZE - 1 && board[maxRow + 1][col]) maxRow++
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

    const cells = computeWordCells()
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

    let letterSum = 0
    let wordMultiplier = 1
    cells.forEach(([r, c]) => {
      const tile = board[r][c]!
      let val = LETTER_VALUES[tile.letter]
      const isPending = pendingTiles.some((p) => p.row === r && p.col === c)
      const bonus = BONUS[`${r}-${c}`]
      if (isPending && bonus) {
        if (bonus === 'DL') val *= 2
        if (bonus === 'TL') val *= 3
        if (bonus === 'DW') wordMultiplier *= 2
        if (bonus === 'TW') wordMultiplier *= 3
      }
      letterSum += val
    })
    const roundScore = letterSum * wordMultiplier

    const newTotal = totalScore + roundScore
    setTotalScore(newTotal)
    setLastWord({ word: word.toUpperCase(), points: roundScore })

    const remaining = rack.filter((_, i) => !usedRackIndices.has(i))
    const newTiles = drawTiles(pendingTiles.length)
    setRack([...remaining, ...newTiles])

    setPendingTiles([])
    setMessage('')

    setBestScore(maybeUpdateBestScore(newTotal))

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
              const bonus = BONUS[`${r}-${c}`]
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
                      : bonus
                      ? `${BONUS_STYLES[bonus]} border-gray-300 dark:border-gray-700 hover:brightness-95`
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
                  ) : bonus ? (
                    <span className="text-[7px] sm:text-[8px]">{bonus}</span>
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

        <div className="flex gap-2 flex-wrap justify-center">
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
            onClick={shuffleRack}
            disabled={pendingTiles.length > 0}
            title={pendingTiles.length > 0 ? 'Recall placed tiles first' : 'Shuffle rack'}
            className="px-4 py-2 rounded bg-purple-500 text-white font-semibold transition active:scale-95 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🔀 Shuffle
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-white dark:text-black font-semibold transition active:scale-95 hover:brightness-110"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap justify-center mt-2">
          {rack.map((letter, i) => {
            const isUsed = usedRackIndices.has(i)
            return (
              <button
                key={i}
                onClick={() => !isUsed && setSelectedRackIndex(selectedRackIndex === i ? null : i)}
                disabled={isUsed}
                className={`relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg text-lg sm:text-xl font-bold uppercase border-2 shadow-md transition active:scale-90 ${
                  isUsed
                    ? 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed'
                    : selectedRackIndex === i
                    ? 'bg-blue-400 border-blue-600 text-white scale-110'
                    : 'bg-amber-100 dark:bg-amber-900/70 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:brightness-105'
                }`}
              >
                {letter}
                <span className="absolute bottom-0.5 right-1 text-[9px] font-normal">
                  {LETTER_VALUES[letter]}
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600">
          Tap a tile, then tap a board square. Place letters in one straight line, then submit — words can connect to existing tiles.
        </p>
      </div>
    </main>
  )
}