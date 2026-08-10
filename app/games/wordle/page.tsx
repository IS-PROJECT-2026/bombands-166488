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

export default function WordlePage() {
  return (
    <main className="flex flex-col items-center p-6 gap-6">
      <h1 className="text-2xl font-bold">Wordle</h1>
    </main>
  )
}