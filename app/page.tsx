import Link from 'next/link'

const games = [
  { name: 'Crossword', href: '/games/crossword', emoji: '🧩', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  { name: 'Word Search', href: '/games/wordsearch', emoji: '🔍', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
  { name: 'Sudoku', href: '/games/sudoku', emoji: '🔢', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  { name: 'Wordle', href: '/games/wordle', emoji: '🟩', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  { name: 'Scrabble', href: '/games/scrabble', emoji: '🔤', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  { name: 'Hangman', href: '/games/hangman', emoji: '🪢', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' },
]

export default function Home() {
  return (
    <main className="p-6 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Play a game</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Six puzzles, one destination.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {games.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="group border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center transition hover:shadow-lg hover:-translate-y-1 hover:border-gray-300 dark:hover:border-gray-600"
          >
            <div
              className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl transition group-hover:scale-110 ${game.color}`}
            >
              {game.emoji}
            </div>
            <div className="font-semibold">{game.name}</div>
          </Link>
        ))}
      </div>
    </main>
  )
}