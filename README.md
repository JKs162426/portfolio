# jfigueroa.dev

Personal portfolio of **Jesus Figueroa** — full-stack developer pursuing a
Bachelor's in Software Development at BYU-Idaho.

**Live:** <https://jfigueroa.dev>

## What's inside

- **Portfolio** — about, skills, projects and contact. Bilingual (EN/ES), with
  the chosen language remembered between visits.
- **Lab** (`/lab`) — small, self-contained apps:
  - **Matchday** (`/lab/football`) — standings, fixtures and results from the
    Premier League, LaLiga, Serie A, Bundesliga and Ligue 1 via
    [football-data.org](https://www.football-data.org). The API key stays on the
    server behind a Vercel Function. See its
    [README](src/pages/lab/football/README.md).
  - **Loop** (`/lab/todo`) — task manager with editing, filters and
    persistence (`useReducer` + `localStorage`).

## Stack

React 19 · React Router 7 · Vite · plain CSS · Vercel Functions ·
Vitest + Testing Library

## Getting started

```bash
npm install
cp .env.example .env.local   # add your football-data.org API key
npm run dev
```

| Script | Description |
|---|---|
| `npm run dev` | Dev server (includes the `/api/football` proxy) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite |
| `npm run lint` | Lint with ESLint |

## Deployment

Deployed on Vercel. Set `FOOTBALL_DATA_API_KEY` in *Project Settings →
Environment Variables*. `vercel.json` rewrites client-side routes to
`index.html`; `/api/*` is served by Vercel Functions.

## Project structure

```
api/                    Vercel Functions (football-data.org proxy)
public/                 Static assets (CV, favicon, social preview image)
src/
  components/           Navbar, footer, 404 and error pages
  context/              Language (EN/ES) provider
  data/content.js       All site copy, in English and Spanish
  hooks/                Reusable hooks
  pages/lab/            Lab apps (football, todo)
  sections/             Home page sections
  styles/               One stylesheet per section/page
```
