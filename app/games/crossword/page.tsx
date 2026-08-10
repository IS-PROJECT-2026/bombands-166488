'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Check, Eye } from 'lucide-react';

type WordEntry = { word: string; clue: string };
type Placement = WordEntry & { row: number; col: number; dir: 'across' | 'down' };

const WORD_BANK: WordEntry[] = [
  { word: 'REACT', clue: 'JS library for building UIs' },
  { word: 'PYTHON', clue: 'Language named after a comedy troupe' },
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
];

const SIZE = 20;

function emptyGrid(): (string | null)[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}
function inBounds(r: number, c: number) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function canPlace(grid: (string | null)[][], word: string, row: number, col: number, dir: 'across' | 'down') {
  const dr = dir === 'down' ? 1 : 0;
  const dc = dir === 'across' ? 1 : 0;
  const br = row - dr, bc = col - dc;
  if (inBounds(br, bc) && grid[br][bc] !== null) return false;
  const ar = row + dr * word.length, ac = col + dc * word.length;
  if (inBounds(ar, ac) && grid[ar][ac] !== null) return false;

  let hasIntersection = false;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i, c = col + dc * i;
    if (!inBounds(r, c)) return false;
    const existing = grid[r][c];
    if (existing !== null) {
      if (existing !== word[i]) return false;
      hasIntersection = true;
    } else if (dir === 'across') {
      if (inBounds(r - 1, c) && grid[r - 1][c] !== null) return false;
      if (inBounds(r + 1, c) && grid[r + 1][c] !== null) return false;
    } else {
      if (inBounds(r, c - 1) && grid[r][c - 1] !== null) return false;
      if (inBounds(r, c + 1) && grid[r][c + 1] !== null) return false;
    }
  }
  return hasIntersection;
}

function place(grid: (string | null)[][], word: string, row: number, col: number, dir: 'across' | 'down') {
  const dr = dir === 'down' ? 1 : 0;
  const dc = dir === 'across' ? 1 : 0;
  for (let i = 0; i < word.length; i++) grid[row + dr * i][col + dc * i] = word[i];
}

function attemptGenerate(words: WordEntry[]) {
  const grid = emptyGrid();
  const list = [...words].sort((a, b) => b.word.length - a.word.length);
  const placed: Placement[] = [];

  const first = list[0];
  const startR = Math.floor(SIZE / 2);
  const startC = Math.floor(SIZE / 2 - first.word.length / 2);
  place(grid, first.word, startR, startC, 'across');
  placed.push({ ...first, row: startR, col: startC, dir: 'across' });

  for (let i = 1; i < list.length; i++) {
    const w = list[i];
    const candidates: { row: number; col: number; dir: 'across' | 'down' }[] = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const letter = grid[r][c];
        if (letter === null) continue;
        for (let li = 0; li < w.word.length; li++) {
          if (w.word[li] !== letter) continue;
          const acrossRow = r, acrossCol = c - li;
          if (canPlace(grid, w.word, acrossRow, acrossCol, 'across'))
            candidates.push({ row: acrossRow, col: acrossCol, dir: 'across' });
          const downRow = r - li, downCol = c;
          if (canPlace(grid, w.word, downRow, downCol, 'down'))
            candidates.push({ row: downRow, col: downCol, dir: 'down' });
        }
      }
    }
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      place(grid, w.word, pick.row, pick.col, pick.dir);
      placed.push({ ...w, row: pick.row, col: pick.col, dir: pick.dir });
    }
  }
  return { grid, placed };
}

function generateCrossword() {
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5).slice(0, 9);
  let best: { grid: (string | null)[][]; placed: Placement[] } | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const result = attemptGenerate(shuffled);
    if (!best || result.placed.length > best.placed.length) best = result;
  }
  return best!;
}

function computeBounds(grid: (string | null)[][]) {
  let minR = SIZE, maxR = -1, minC = SIZE, maxC = -1;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== null) {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
      }
    }
  }
  return { minR, maxR, minC, maxC };
}

function buildNumbers(grid: (string | null)[][], b: ReturnType<typeof computeBounds>) {
  const rows = b.maxR - b.minR + 1, cols = b.maxC - b.minC + 1;
  const numbers: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  let n = 1;
  for (let r = b.minR; r <= b.maxR; r++) {
    for (let c = b.minC; c <= b.maxC; c++) {
      if (grid[r][c] === null) continue;
      const leftEmpty = !inBounds(r, c - 1) || grid[r][c - 1] === null;
      const rightFull = inBounds(r, c + 1) && grid[r][c + 1] !== null;
      const upEmpty = !inBounds(r - 1, c) || grid[r - 1][c] === null;
      const downFull = inBounds(r + 1, c) && grid[r + 1][c] !== null;
      if ((leftEmpty && rightFull) || (upEmpty && downFull)) {
        numbers[r - b.minR][c - b.minC] = n;
        n++;
      }
    }
  }
  return numbers;
}

export default function CrosswordPage() {
  const [solution, setSolution] = useState<(string | null)[][]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [bounds, setBounds] = useState({ minR: 0, maxR: 0, minC: 0, maxC: 0 });
  const [numbers, setNumbers] = useState<(number | null)[][]>([]);
  const [userGrid, setUserGrid] = useState<(string | null)[][]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const newPuzzle = useCallback(() => {
    const gen = generateCrossword();
    const b = computeBounds(gen.grid);
    const rows = b.maxR - b.minR + 1, cols = b.maxC - b.minC + 1;
    setSolution(gen.grid);
    setPlacements(gen.placed);
    setBounds(b);
    setNumbers(buildNumbers(gen.grid, b));
    setUserGrid(Array.from({ length: rows }, () => Array(cols).fill(null)));
  }, []);

  useEffect(() => { newPuzzle(); }, [newPuzzle]);

  function handleInput(r: number, c: number, raw: string) {
    const v = raw.toUpperCase().replace(/[^A-Z]/, '');
    setUserGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = v || null;
      return next;
    });
    if (v) {
      const cols = bounds.maxC - bounds.minC + 1;
      for (let cc = c + 1; cc < cols; cc++) {
        const el = inputRefs.current[`${r}-${cc}`];
        if (el) { el.focus(); break; }
      }
    }
  }

  function handleKeyDown(r: number, c: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !userGrid[r]?.[c]) {
      for (let cc = c - 1; cc >= 0; cc--) {
        const el = inputRefs.current[`${r}-${cc}`];
        if (el) { el.focus(); break; }
      }
    }
  }

  const acrossClues = placements
    .filter(p => p.dir === 'across')
    .map(p => ({ n: numbers[p.row - bounds.minR]?.[p.col - bounds.minC], clue: p.clue }))
    .sort((a, b) => (a.n ?? 0) - (b.n ?? 0));
  const downClues = placements
    .filter(p => p.dir === 'down')
    .map(p => ({ n: numbers[p.row - bounds.minR]?.[p.col - bounds.minC], clue: p.clue }))
    .sort((a, b) => (a.n ?? 0) - (b.n ?? 0));

  const rows = bounds.maxR - bounds.minR + 1;
  const cols = bounds.maxC - bounds.minC + 1;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-gray-500 text-sm">Fill in the grid</p>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm">
            <Check size={16} /> Check
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm">
            <Eye size={16} /> Reveal
          </button>
          <button onClick={newPuzzle} className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm">
            <RefreshCw size={16} /> New puzzle
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-wrap">
        <div
          className="inline-grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${cols}, 28px)`, gridTemplateRows: `repeat(${rows}, 28px)` }}
        >
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const letter = solution[r + bounds.minR]?.[c + bounds.minC];
              if (letter === null || letter === undefined) {
                return <div key={`${r}-${c}`} className="bg-gray-100" />;
              }
              const num = numbers[r]?.[c];
              return (
                <div key={`${r}-${c}`} className="relative border border-gray-400 bg-white">
                  {num && <span className="absolute top-0 left-0.5 text-[9px] text-gray-400">{num}</span>}
                  <input
                    ref={el => { inputRefs.current[`${r}-${c}`] = el; }}
                    maxLength={1}
                    value={userGrid[r]?.[c] ?? ''}
                    onChange={e => handleInput(r, c, e.target.value)}
                    onKeyDown={e => handleKeyDown(r, c, e)}
                    className="w-full h-full text-center font-medium uppercase bg-transparent outline-none text-sm"
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-6 flex-1 min-w-[200px]">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Across</div>
            {acrossClues.map((i, idx) => <div key={idx} className="text-sm">{i.n}. {i.clue}</div>)}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Down</div>
            {downClues.map((i, idx) => <div key={idx} className="text-sm">{i.n}. {i.clue}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}