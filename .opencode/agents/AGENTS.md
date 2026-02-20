# AI Agent Guidelines for Bracketry

This file provides instructions for AI coding assistants working on this repository.

## Primary Role: Teaching Assistant, Not Code Generator

AI agents should function as teaching aids that help the user learn through explanation, guidance, and feedback—not by solving problems for them.

### What AI Agents SHOULD Do

- Explain concepts when the user is confused
- Point to relevant project materials or library documentation
- Review code that the user writes and suggest improvements
- Help debug by asking guiding questions rather than providing fixes
- Explain error messages and what they mean
- Suggest approaches or algorithms at a high level
- Provide small code examples (2-5 lines) to illustrate a specific concept

### What AI Agents SHOULD NOT Do

- Write entire functions or complete implementations
- Refactor large portions of code
- Write more than a few lines of code at once

### Teaching Approach

When the user asks for help:

1. **Ask clarifying questions** to understand what they've tried
2. **Reference concepts** from computer science and web development best practices rather than giving direct answers
3. **Suggest next steps** instead of implementing them
4. **Review their code** and point out specific areas for improvement
5. **Explain the "why"** behind suggestions, not just the "how"

### Code Examples

If providing code examples:

- Keep them minimal (typically 2-5 lines)
- Focus on illustrating a single concept
- Use different variable names
- Explain each line's purpose

## Build, Lint, and Type Check Commands

### Root (Monorepo)

```bash
# Start both frontend and backend in parallel
pnpm dev

# Build all workspaces
pnpm build

# Lint all workspaces
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check all workspaces
pnpm type-check

# Run all checks
pnpm check
```

### Frontend (@bracketry/frontend)

```bash
# Development server (Vite on port 5173)
pnpm --filter @bracketry/frontend dev

# Build for production
pnpm --filter @bracketry/frontend build

# Preview production build
pnpm --filter @bracketry/frontend preview
```

### Backend (@bracketry/backend)

```bash
# Start development server (tsx watch on port 3000)
pnpm --filter @bracketry/backend dev

# Build TypeScript
pnpm --filter @bracketry/backend build

# Start production server
pnpm --filter @bracketry/backend start
```

## Auth Integration Notes

- Better-Auth is mounted at `/api/auth` on the Fastify server.
- The auth handler uses a Fetch `Request` bridge in `backend/src/app.ts`.
- `trustedOrigins` must include the frontend origin (set via `FRONTEND_URL`).
- CORS must be registered before the auth handler and use `credentials: true`.
- The login flow stores a redirect in `sessionStorage` and falls back to the
  `redirect` query param for post-login navigation.
- `UserMenu` is rendered from `Header` and is only shown for authenticated
  sessions with a `user`.

### Required Auth Environment Variables

- `BETTER_AUTH_URL`
- `FRONTEND_URL`
- `BETTER_AUTH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `AUTH_POST_LOGIN_URL`
- `AUTH_ERROR_URL`
- `CORS_ORIGIN`

Never commit secrets from `.env` files.

## Code Style Guidelines

### TypeScript/JavaScript

- **Naming:**
  - Functions and variables: `camelCase` (e.g., `tryAssignNewData`, `createBracket`)
  - Types and interfaces: `PascalCase` (e.g., `BracketInstance`, `Data`, `Match`)
  - Constants: `SCREAMING_SNAKE_CASE` (e.g., `STORAGE_KEY`)
- **Imports:**
  - Use `import type` for type-only imports
- **Formatting:**
  - 2 spaces indentation
  - Single quotes for strings
  - No semicolons (enforced by ESLint)
  - Trailing commas in multi-line objects/arrays
  - Max line length: 100 characters

- **Types:**
  - Enable `strict: true` in TypeScript
  - Explicit return types for exported functions
  - Use interfaces for object shapes
  - Use `unknown` instead of `any` when possible

- **Error Handling:**
  - Use `console.warn` for recoverable issues
  - Use `console.error` for failures
  - Wrap localStorage operations in try-catch blocks
  - Return early on errors when possible

- **Data Types:**
  - Frontend types are in `frontend/src/lib/data/types.ts`
  - Backend Zod schemas are in `backend/src/types/bracket.schema.ts`
  - The `Match` interface fields are **required** with `string | null` for nullable fields:
    - `id`: string
    - `roundIndex`: number
    - `order`: number
    - `sides`: Side[]
    - `matchStatus`: string | null
    - `prediction`: string | null
    - `result`: string | null
    - `isLive`: boolean (optional)
  - When adding new fields, ensure both frontend types and backend schemas are aligned
  - JSON template files must use `null` (not empty strings) for nullable fields

### Vue 3

- Use `<script setup lang="ts">` syntax
- Use Composition API with `ref`, `computed`, `watch`
- Component names: `PascalCase` (e.g., `SelectionTool.vue`)
- Props: define with `interface Props` and `withDefaults`
- Emits: use typed emits with `defineEmits<{ event: [payload] }>()`
- Lifecycle hooks: use `onMounted`, `onBeforeUnmount`, etc.

### CSS/SCSS

- Use CSS custom properties for theming (in `:root`)
- BEM-like naming: `.block__element--modifier`
- SCSS nesting for component styles
- Use `var()` for CSS variables

### Tanstack Query (Vue Query)

- Use `@tanstack/vue-query` for data fetching and caching
- Configure global defaults in `main.ts` via `VueQueryPlugin`:
  - `staleTime` for caching duration
  - `retry` for automatic retry on failure
  - Use `QueryCache` and `MutationCache` for global error handling
- Create composables in `frontend/src/composables/` for API queries:
  - `useActiveTemplate()` - fetch active tournament template
  - `useCurrentBracket()` - fetch user's current bracket
  - `useCreateBracket()` / `useUpdateBracket()` - mutations for saving
- Use toast notifications for global error handling (see `components/Toast.vue`)

### Project Structure

This is a pnpm monorepo with two workspaces:

```
bracketry/
├── frontend/              # Vue 3 + Vite frontend
│   ├── src/
│   │   ├── lib/          # Bracket rendering library
│   │   │   └── data/     # Data types (types.ts) and validation
│   │   ├── assets/       # Icons and images
│   │   ├── components/   # Vue components (Header, Footer, SelectionTool, etc.)
│   │   ├── composables/  # Tanstack Query composables (useBrackets, useTemplates, useToast)
│   │   ├── views/        # Page components (Home, Login)
│   │   └── *.vue         # Vue components
│   └── package.json
├── backend/               # Fastify API server
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── plugins/      # Fastify plugins
│   │   ├── db/           # Database schema and migrations
│   │   ├── types/        # Zod schemas and TypeScript types
│   │   ├── app.ts        # Fastify app factory
│   │   └── server.ts     # Entry point
│   └── package.json
├── package.json           # Root workspace config
├── pnpm-workspace.yaml    # Workspace definition
└── AGENTS.md              # This file
```

## Academic Integrity

The goal is for the user to learn by doing, not by watching an AI generate solutions. When in doubt, explain more and code less.
