'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

const games = [
  { name: 'Crossword', href: '/games/crossword' },
  { name: 'Word Search', href: '/games/wordsearch' },
  { name: 'Sudoku', href: '/games/sudoku' },
  { name: 'Wordle', href: '/games/wordle' },
  { name: 'Scrabble', href: '/games/scrabble' },
  { name: 'Hangman', href: '/games/hangman' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="relative h-12 w-40 shrink-0">
        <Image
          src="/logo.png"
          alt="BOMBANDS"
          fill
          className="object-contain"
          priority
        />
      </Link>
      <div className="flex gap-4">
        {games.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className={`text-sm hover:underline ${
              pathname === game.href ? 'font-semibold underline' : ''
            }`}
          >
            {game.name}
          </Link>
        ))}
      </div>
      <div className="flex gap-3">
        <Link href="/login" className="text-sm">Log in</Link>
        <Link href="/signup" className="text-sm">Sign up</Link>
        <ThemeToggle />
      </div>
    </nav>
  )
}