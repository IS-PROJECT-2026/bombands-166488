# BOMBANDS

A multi-game platform inspired by NYT Games, built for our GitHub
Workflow mini-project. Play Crossword, Word Search, Sudoku, Wordle,
Scrabble, and Hangman — all in one place, with user accounts to track
your play.

## Tech Stack

- **Next.js** (App Router, TypeScript, statically exported for GitHub Pages)
- **Tailwind CSS** for styling
- **Supabase** for authentication
- **GitHub Actions** for CI/CD deployment to GitHub Pages

## Games

| Game |
|---|
| Sudoku | 
| Word Search |
| Wordle |
| Scrabble |
| Hangman |
| Crossword |

## Running Locally

```bash
git clone <repo-url>
cd bombands-166488
npm install
```

Create `.env.local` in the project root with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

```bash
npm run dev
```

Open http://localhost:3000

## Team

| Admission No. | Name | Role |
|---|---|---|
| 166488 | Bwibo Ethan Nimrod | Repo owner / SWE |


## Live Site

Deployed via GitHub Pages: (https://is-project-2026.github.io/bombands-166488/)