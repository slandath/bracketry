# Basketball Bracket

A digital bracket to track your picks for a single-elimination basketball tournament.

Powered by [Bracketry](https://github.com/sbachinin/bracketry)

---

## Development

### Setup

```bash
# Install dependencies for all workspaces
pnpm install

# Copy environment file
cp backend/.env.example backend/.env

# Copy frontend environment file
cp frontend/.env.example frontend/.env
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
- `frontend/.env` → `VITE_APP_URL=http://localhost:5173`

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

## Powered By

[![better-auth](https://img.shields.io/badge/Better--Auth-3B82F6?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/better-auth/better-auth)
[![drizzle](https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=000000)](https://github.com/drizzle-team/drizzle-orm)
[![eslint](https://img.shields.io/badge/ESLint-3A33D1?style=for-the-badge&logo=eslint)](https://github.com/eslint/eslint)
[![fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://github.com/fastify/fastify)
[![postgresql](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=ffffff)](https://github.com/prettier/prettier)
[![primevue](https://img.shields.io/badge/PrimeVue-10B981?style=for-the-badge&logo=primevue&logoColor=white)](https://github.com/primefaces/primevue)
[![sass](https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=Sass&logoColor=white)](https://github.com/sass/dart-sass)
[![tanstack-query](https://img.shields.io/badge/Tanstack_Query-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)](https://github.com/TanStack/query)
[![typescript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=TypeScript&logoColor=FFF)](https://github.com/microsoft/TypeScript)
[![vite](https://img.shields.io/badge/-Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=white)](https://github.com/vitejs/vite)
[![vue](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)](https://github.com/vuejs)
[![zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white)](https://github.com/colinhacks/zod)

- [Antfu's ESLint Config](https://github.com/antfu/eslint-config)
- [Bracketry](https://github.com/sbachinin/bracketry)
