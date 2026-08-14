import Link from 'next/link'
import Image from 'next/image'
import { basePath } from '@/lib/basePath'

type Game = {
  name: string
  href: string
  tileColor: string
  tileImage: string
  hoverContent: React.ReactNode
}

const games: Game[] = [
  {
    name: 'Crossword',
    href: '/games/crossword',
    tileColor: 'bg-yellow-400',
    tileImage: '/tiles/crossword.png',
    hoverContent: (
      <div className="grid grid-cols-3 gap-0.5">
        {['C', 'A', 'T', '', 'R', '', 'D', 'O', 'G'].map((c, i) => (
          <div
            key={i}
            className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-sm ${
              c ? 'bg-white text-gray-900' : 'bg-gray-900'
            }`}
          >
            {c}
          </div>
        ))}
      </div>
    ),
  },
  {
    name: 'Word Search',
    href: '/games/wordsearch',
    tileColor: 'bg-orange-400',
    tileImage: '/tiles/wordsearch.png',
    hoverContent: (
      <div className="flex gap-1">
        {['T', 'R', 'A', 'S'].map((c) => (
          <div
            key={c}
            className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-white text-gray-900"
          >
            {c}
          </div>
        ))}
      </div>
    ),
  },
  {
    name: 'Sudoku',
    href: '/games/sudoku',
    tileColor: 'bg-purple-400',
    tileImage: '/tiles/sudoku.png',
    hoverContent: (
      <div className="grid grid-cols-3 gap-0.5">
        {[4, '', 9, '', 2, '', 7, '', 1].map((n, i) => (
          <div
            key={i}
            className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-sm bg-white text-purple-900"
          >
            {n}
          </div>
        ))}
      </div>
    ),
  },
  {
    name: 'Wordle',
    href: '/games/wordle',
    tileColor: 'bg-green-500',
    tileImage: '/tiles/wordle.png',
    hoverContent: (
      <div className="flex gap-0.5">
        {['bg-green-400', 'bg-yellow-400', 'bg-gray-300', 'bg-green-400', 'bg-yellow-400'].map((c, i) => (
          <div key={i} className={`w-5 h-5 rounded-sm ${c}`} />
        ))}
      </div>
    ),
  },
  {
    name: 'Scrabble',
    href: '/games/scrabble',
    tileColor: 'bg-red-500',
    tileImage: '/tiles/scrabble.png',
    hoverContent: (
      <div className="grid grid-cols-5 gap-1">
        {['S', 'C', 'O', 'R', 'E', 'P', 'O', 'I', 'N', 'T', 'F', 'U', 'N', '', ''].map((c, i) => (
          <div
            key={i}
            className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-sm ${
              c ? 'bg-amber-100 text-amber-900' : 'bg-transparent'
            }`}
          >
            {c}
          </div>
        ))}
      </div>
    ),
  },
  {
    name: 'Hangman',
    href: '/games/hangman',
    tileColor: 'bg-sky-400',
    tileImage: '/tiles/hangman.png',
    hoverContent: <div className="text-2xl leading-none">🎪🧍</div>,
  },
]

export default function Home() {
  return (
    <main className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8 max-w-2xl mx-auto">
        <Image
          src={`${basePath}/banner.png`}
          alt="BOMBANDS — six puzzles, one destination"
          width={2816}
          height={1536}
          className="w-full h-auto rounded-2xl"
          priority
        />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-center">Play a game</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Pick your puzzle to get started.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {games.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="group relative overflow-hidden border border-gray-300 dark:border-gray-800 rounded-2xl p-6 text-center transition hover:shadow-lg hover:-translate-y-1 hover:border-gray-400 dark:hover:border-gray-600"
          >
            <div
              className={`relative w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden shadow-inner transition group-hover:scale-110 ${game.tileColor}`}
            >
              <Image
                src={`${basePath}${game.tileImage}`}
                alt={game.name}
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="font-semibold">{game.name}</div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/85 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity rounded-2xl">
              {game.hoverContent}
            </div>
          </Link>
        ))}
      </div>

      <footer className="mt-12 text-center">
        <p className="font-bold text-sm tracking-widest uppercase text-gray-400 dark:text-gray-600">
          Six Puzzles • One Destination
        </p>
      </footer>
    </main>
  )
}