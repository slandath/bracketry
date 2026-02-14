# Basketball Bracket

A digital bracket to track your picks for a single-elimination basketball tournament.

Powered by [Bracketry](https://github.com/sbachinin/bracketry)

---

## Why?

I was looking for a easy way to track my March Madness picks and I was unsatisfied with the digital brackets I found.

I loved the look of the Bracketry bracket, but it was not designed for basketball. So I converted it from a library to a front-end application and made some tweaks to the data structure.

---

## Architecture

This is a **pnpm monorepo** with two workspaces:

### Frontend (`frontend/`)

- **Vue 3** with Composition API and TypeScript
- **Vite** for development and building
- Bracket visualization using the Bracketry library
- Runs on port 5173 (dev) or 80 (production)

### Backend (`backend/`)

- **Fastify** HTTP server with TypeScript
- **Better-Auth** with GitHub OAuth
- **Drizzle ORM** with PostgreSQL
- CORS enabled for frontend communication
- Runs on port 3000
- Health check endpoint at `/health`

---

## Development

### Prerequisites

- Node.js 24.x
- pnpm 8+

### Setup

```bash
# Install dependencies for all workspaces
pnpm install

# Copy environment file
cp backend/.env.example backend/.env
```

Update `backend/.env` with required auth settings:

- `BETTER_AUTH_URL` (e.g. `http://localhost:3000`)
- `FRONTEND_URL` (e.g. `http://localhost:5173`)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `BETTER_AUTH_SECRET`
- `AUTH_POST_LOGIN_URL` (e.g. `http://localhost:5173/`)
- `AUTH_ERROR_URL` (e.g. `http://localhost:5173/error`)
- `CORS_ORIGIN` (e.g. `http://localhost:5173`)

Frontend env:

- `frontend/.env` → `VITE_API_URL=http://localhost:3000`

GitHub OAuth App callback URL:

- `http://localhost:3000/api/auth/callback/github`

### Running Locally

```bash
# Start both frontend and backend
pnpm dev
```

Or run separately:

```bash
# Terminal 1 - Backend
pnpm --filter @bracketry/backend dev

# Terminal 2 - Frontend
pnpm --filter @bracketry/frontend dev
```

Access the application:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

---

## How It Works

- Bracket is saved locally - no account required.
- GitHub OAuth is available for user sessions.
- Load the tournament information into the JSON template and save in `/frontend/src`.
- Selecting "Make Picks" will open a modal to predict a winner for each match.
- Load game results in the results.json in `/frontend/public`.
- Selecting "Evaluate Bracket" will compare your bracket against the real-game results, highlighting correct picks in green and incorrect picks in red.

---

## Powered By

[![eslint](https://img.shields.io/badge/ESLint-3A33D1?style=for-the-badge&logo=eslint)](https://github.com/eslint/eslint)
[![prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=ffffff)](https://github.com/prettier/prettier)
[![sass](https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=Sass&logoColor=white)](https://github.com/sass/dart-sass)
[![typescript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=TypeScript&logoColor=FFF)](https://github.com/microsoft/TypeScript)
[![vite](https://img.shields.io/badge/-Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=white)](https://github.com/vitejs/vite)
[![vue](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)](https://github.com/vuejs)
[![fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://github.com/fastify/fastify)

- [Antfu's ESLint Config](https://github.com/antfu/eslint-config)
- [Bracketry](https://github.com/sbachinin/bracketry)
