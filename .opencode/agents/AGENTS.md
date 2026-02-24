# AGENTS.md - Bracketry Codebase Guide

## Project Overview

Bracketry is a pnpm monorepo with Vue 3 frontend (Vite) and Fastify backend.

## Build, Lint, and Type Check Commands

### Root (Monorepo)

```bash
pnpm dev          # Start frontend and backend in parallel
pnpm build        # Build all workspaces
pnpm lint         # Lint all workspaces
pnpm lint:fix     # Fix linting issues
pnpm type-check   # Type check all workspaces
pnpm check        # Run lint + type-check
```

### Frontend (@bracketry/frontend)

```bash
pnpm --filter @bracketry/frontend dev        # Dev server (Vite, port 5173)
pnpm --filter @bracketry/frontend build       # Production build
pnpm --filter @bracketry/frontend preview    # Preview production build
pnpm --filter @bracketry/frontend lint        # Lint
pnpm --filter @bracketry/frontend lint:fix    # Fix lint issues
pnpm --filter @bracketry/frontend type-check # TypeScript check
```

### Backend (@bracketry/backend)

```bash
pnpm --filter @bracketry/backend dev          # Dev server (tsx watch, port 3000)
pnpm --filter @bracketry/backend build        # Compile TypeScript
pnpm --filter @bracketry/backend start        # Start production server
pnpm --filter @bracketry/backend lint         # Lint
pnpm --filter @bracketry/backend lint:fix      # Fix lint issues
pnpm --filter @bracketry/backend type-check   # TypeScript check
```

### Database (Backend)

```bash
pnpm --filter @bracketry/backend db:generate  # Generate Drizzle migrations
pnpm --filter @bracketry/backend db:migrate   # Run migrations
pnpm --filter @bracketry/backend db:push       # Push schema to DB
pnpm --filter @bracketry/backend db:studio     # Open Drizzle Studio
```

### Running Single Tests

**Note:** This project currently has no test suite. To add tests, consider using Vitest.

## Code Style Guidelines

### TypeScript/JavaScript

- **Naming:**
  - Functions/variables: `camelCase` (e.g., `tryAssignNewData`, `createBracket`)
  - Types/interfaces: `PascalCase` (e.g., `BracketInstance`, `Match`)
  - Constants: `SCREAMING_SNAKE_CASE` (e.g., `STORAGE_KEY`)

- **Imports:**
  - Use `import type` for type-only imports
  - Group imports: external libs → internal modules → relative paths

- **Formatting (ESLint + Prettier via @antfu/eslint-config):**
  - 2 spaces indentation
  - Single quotes for strings
  - No semicolons
  - Trailing commas in multi-line objects/arrays
  - Max line length: 100 characters

- **Types:**
  - Enable `strict: true` in TypeScript
  - Explicit return types for exported functions
  - Use interfaces for object shapes
  - Prefer `unknown` over `any`

- **Error Handling:**
  - `console.warn` for recoverable issues
  - `console.error` for failures
  - Wrap localStorage operations in try-catch
  - Return early on errors when possible

### Vue 3

- Use `<script setup lang="ts">` (Composition API required)
- Component names: `PascalCase` (e.g., `SelectionTool.vue`)
- Props: define with `interface Props` and `withDefaults`
- Emits: use typed emits with `defineEmits<{ event: [payload] }>()`
- Lifecycle: `onMounted`, `onBeforeUnmount`, etc.

### CSS/SCSS

- CSS custom properties for theming (`:root`)
- BEM-like naming: `.block__element--modifier`
- Use `var()` for CSS variables

### Tanstack Query (Vue Query)

- Use `@tanstack/vue-query` for data fetching
- Configure `VueQueryPlugin` in `main.ts` with `staleTime`, `retry`
- Create composables in `frontend/src/composables/`:
  - `useActiveTemplate()`, `useCurrentBracket()`
  - `useCreateBracket()`, `useUpdateBracket()`
- Use toast notifications for global error handling

### Data Types Alignment

- Frontend types: `frontend/src/lib/data/types.ts`
- Backend Zod schemas: `backend/src/types/bracket.schema.ts`
- `Match` interface fields are required with `string | null` for nullable:
  - `id`, `roundIndex`, `order`, `sides`, `matchStatus`, `prediction`, `result`, `isLive` (optional)
- When adding fields, update both frontend types and backend schemas
- JSON templates: use `null` (not empty strings) for nullable fields

## Project Structure

```
bracketry/
├── frontend/                    # Vue 3 + Vite
│   ├── src/
│   │   ├── lib/data/           # Types and validation
│   │   ├── components/         # Vue components
│   │   ├── composables/        # Tanstack Query composables
│   │   ├── views/              # Page components
│   │   └── *.vue
├── backend/                     # Fastify API
│   ├── src/
│   │   ├── routes/             # API routes
│   │   ├── plugins/            # Fastify plugins
│   │   ├── db/                 # Drizzle schema/migrations
│   │   ├── types/              # Zod schemas
│   │   ├── app.ts              # Fastify app factory
│   │   └── server.ts           # Entry point
├── package.json                 # Root workspace
├── pnpm-workspace.yaml
└── AGENTS.md
```

## Auth Integration (Better-Auth)

- Mounted at `/api/auth` on Fastify server
- Auth handler uses Fetch `Request` bridge in `backend/src/app.ts`
- `trustedOrigins` must include frontend origin (`FRONTEND_URL`)
- CORS registered before auth handler with `credentials: true`
- Login flow stores redirect in `sessionStorage`, falls back to `redirect` query param
- `UserMenu` in `Header` only shown for authenticated sessions

### Required Environment Variables

- `BETTER_AUTH_URL`, `FRONTEND_URL`, `BETTER_AUTH_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `AUTH_POST_LOGIN_URL`, `AUTH_ERROR_URL`, `CORS_ORIGIN`

**Never commit secrets from `.env` files.**

## Editor Config

- Node.js: 24.x
- Package manager: pnpm 8.15.9
- ESLint: `@antfu/eslint-config` with Prettier formatters
