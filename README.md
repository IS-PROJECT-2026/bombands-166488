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

| Game | Owner |
|---|---|
| Sudoku | Kirui Sharlet Jerono |
| Word Search | Deborah Kaburu |
| Wordle | Bwibo Ethan Nimrod |
| Scrabble | Githinji Nathan Rugo |
| Hangman | Wangeci Brown Kamau |
| Crossword | Njenga Martin Njuguna |

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
| 166488 | Bwibo Ethan Nimrod | Repo owner / Wordle |
| 160588 | Kirui Sharlet Jerono | Sudoku |
| 166531 | Deborah Kaburu | Word Search |
| 166386 | Githinji Nathan Rugo | Scrabble |
| 162831 | Wangeci Brown Kamau | Hangman |
| 165852 | Njenga Martin Njuguna | Crossword |

## Live Site

Deployed via GitHub Pages: *link once first deploy succeeds*