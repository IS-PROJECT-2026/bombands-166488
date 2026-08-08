import Link from 'next/link'

const games = [
  { name: 'Crossword', href: '/games/crossword', emoji: '🧩' },
  { name: 'Word Search', href: '/games/wordsearch', emoji: '🔍' },
  { name: 'Sudoku', href: '/games/sudoku', emoji: '🔢' },
  { name: 'Wordle', href: '/games/wordle', emoji: '🟩' },
  { name: 'Scrabble', href: '/games/scrabble', emoji: '🔤' },
  { name: 'Hangman', href: '/games/hangman', emoji: '🪢' },
]

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Play a game</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {games.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="border rounded-lg p-6 text-center hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">{game.emoji}</div>
            <div className="font-medium">{game.name}</div>
          </Link>
        ))}
      </div>
    </main>
  )
}