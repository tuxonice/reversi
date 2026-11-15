# Reversi

Reversi (Othello) in the browser: play as black against a bot that plays white. Built with React, TypeScript and Vite, and installable as a PWA that works offline.

## Features

- Standard 8x8 rules with legal-move highlighting, automatic passes, live score and a winner screen
- Greedy bot opponent (picks the move that flips the most discs, ties broken at random)
- Installable PWA with offline support via a service worker

## Requirements

- Node.js 24 or newer

## Development

```bash
npm install
npm run dev
```

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck and build for production into `dist` |
| `npm run preview` | Serve the production build locally (use this to test the PWA) |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting |
| `npm test` | Run the Vitest unit tests |
| `npm run check` | Lint, typecheck and test in one go |
| `npm run audit:prod` | Audit production dependencies |

## Project structure

```
src/
  engine/reversi.ts   Pure game rules: board, legal moves, flips, scoring
  engine/bot.ts       Bot move selection
  engine/*.test.ts    Unit tests for the engine and bot
  App.tsx             UI and game state
  main.tsx            Entry point and service worker registration
public/
  sw.js               Service worker (offline cache)
  manifest.webmanifest
vercel.json           Security headers (CSP and others)
```

The engine has no React dependency, so rules and bot logic can be tested in isolation.

## Quality and security

- CI (`.github/workflows/ci.yml`) runs `npm run check`, the build and `npm audit` on every pull request, on pushes to `main` and weekly.
- Dependabot opens weekly update PRs for npm packages and GitHub Actions.
- `vercel.json` sets a strict Content-Security-Policy and other security headers. If you host elsewhere, apply the same headers there.
- `package.json` has a `minimatch` override to fix an audit advisory. TypeScript is held at 6.0 because `typescript-eslint` does not support 7 yet. Revisit both when upstream catches up.

## Deploy to Vercel

### Deploy from GitHub (recommended)

- Push the repo to GitHub.
- In Vercel: **New Project** -> import the repo.
- If Vercel asks for settings, use:
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
  - **Install Command:** `npm install`

### Deploy with Vercel CLI

Install:

```bash
npm i -g vercel
```

Deploy:

```bash
vercel
```

Production deploy:

```bash
vercel --prod
```

### SPA routing note

This app is currently a single page. If you later add client-side routing (e.g. `react-router`) you may need a rewrite rule so page refreshes work on non-root routes.

## License

[MIT](LICENSE)
