'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'
import { basePath } from '@/lib/basePath'

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
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <Link href="/" className="relative h-10 w-32 sm:h-12 sm:w-40 shrink-0" onClick={() => setMenuOpen(false)}>
          <Image src={`${basePath}/logo.png`} alt="BOMBANDS" fill className="object-contain" priority />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-4">
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

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm">Log in</Link>
          <Link href="/signup" className="text-sm">Sign up</Link>
          <ThemeToggle />
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            className="p-2"
          >
            <div className="w-6 h-0.5 bg-gray-900 dark:bg-white mb-1.5" />
            <div className="w-6 h-0.5 bg-gray-900 dark:bg-white mb-1.5" />
            <div className="w-6 h-0.5 bg-gray-900 dark:bg-white" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden flex flex-col px-4 pb-4 gap-3 border-t border-gray-200 dark:border-gray-800 pt-3">
          {games.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm ${pathname === game.href ? 'font-semibold underline' : ''}`}
            >
              {game.name}
            </Link>
          ))}
          <div className="flex gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
            <Link href="/login" className="text-sm" onClick={() => setMenuOpen(false)}>Log in</Link>
            <Link href="/signup" className="text-sm" onClick={() => setMenuOpen(false)}>Sign up</Link>
          </div>
        </div>
      )}
    </nav>
  )
}