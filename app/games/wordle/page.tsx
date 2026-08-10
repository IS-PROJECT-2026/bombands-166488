'use client'

import { useState } from 'react'

const WORD_LENGTH = 5
const MAX_GUESSES = 6

const WORDS = [
  'apple', 'brave', 'crane', 'delta', 'eagle', 'flame', 'grape', 'house',
  'input', 'joker', 'knock', 'lemon', 'mango', 'noise', 'ocean', 'piano',
  'query', 'river', 'stone', 'table', 'unite', 'vivid', 'water', 'xenon',
  'youth', 'zebra', 'chair', 'dance', 'earth', 'fruit',
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

export default function WordlePage() {
  const [mode, setMode] = useState<'daily' | 'practice'>('daily')
  const [target, setTarget] = useState(getDailyWord())

  return (
    <main className="flex flex-col items-center p-6 gap-6">
      <h1 className="text-2xl font-bold">Wordle</h1>
      <div className="flex gap-2">
        <button
          onClick={() => { setMode('daily'); setTarget(getDailyWord()) }}
          className={`px-4 py-2 rounded ${mode === 'daily' ? 'bg-black text-white' : 'bg-gold-200'}`}
        >
          Daily
        </button>
        <button
          onClick={() => { setMode('practice'); setTarget(getRandomWord()) }}
          className={`px-4 py-2 rounded ${mode === 'practice' ? 'bg-black text-white' : 'bg-gold-200'}`}
        >
          Practice
        </button>
      </div>
    </main>
  )
}