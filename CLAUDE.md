# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Start development server
bun run build        # Build for production (adapter-node → build/index.js)
bun run check        # Type check with svelte-check
bun run lint         # Run prettier + eslint
bun run format       # Format code with prettier

# Database (Drizzle ORM with PostgreSQL)
bun run db:push      # Push schema to database
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
bun run db:seed      # Seed admin user (scripts/seed.ts)
bun run db:build-forecast  # Rebuild forecast model from DB (scripts/build-forecast-model.ts)

# Deployment
bun run rsync        # Sync code to production server (goai:/var/www/napco-v2)
bun run setup        # Install deps, build, and start/restart pm2
```

Note: All `db:*` scripts load `.env` via `env $(grep -v '^#' .env 2>/dev/null | xargs)` prefix.

## Architecture

### Tech Stack

- **Framework:** SvelteKit with Svelte 5 (runes: `$state`, `$props`, `$derived`, `$effect`)
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** better-auth with email/password + admin plugin (role-based access)
- **Styling:** Tailwind CSS v4 + shadcn-svelte components
- **Data Tables:** TanStack Table (`@tanstack/table-core`)
- **Production:** adapter-node, PM2 (port 4002), Caddy reverse proxy

### Routes

- `/` → redirects to `/campaigns`
- `/campaigns` — Campaign analytics (filters: search, category, date range picker)
- `/keywords` — Keyword performance analytics
- `/products` — Product performance analytics (filters: search, category)
- `/forecast` — Ad sales forecasting engine (listing/search toggle, product selection, budget/dates)
- `/upload` — Excel file upload (reports + sellout data)
- `/users` — Admin-only user management (CRUD)
- `/auth/login` — Login page (no public signup)
- `/api/upload` — REST API for file upload (POST), clear data (DELETE), counts (GET)

### Database Schema (`src/lib/server/db/schema.ts`)

- **reports** — Ad campaign performance data (50+ fields: ROAS, clicks, orders, keywords, categories, etc.)
- **sellout** — Sales/sellout data from Excel uploads
- **user/session/account/verification** — better-auth tables (user has `role`, `banned` fields)

### Authentication Flow

1. `hooks.server.ts` handles auth via better-auth's `svelteKitHandler`
2. Session attached to `event.locals.user`
3. `+layout.server.ts` redirects unauthenticated users (except `/auth/*` routes)
4. Admin routes check `user.role === 'admin'`

### Forecast System

See [FORECAST.md](./FORECAST.md) for detailed documentation. Key files:

- `scripts/build-forecast-model.ts` — Queries DB, outputs `static/forecast-model-v2.json`
- `src/lib/forecast.ts` — Forecast engine (imported by `/forecast` page server)

### Cross-Page Filtering

Pages link to each other with query params for filtered views:

- Campaigns ↔ Products: `?campaign={id}` / `?product={id}`
- Campaigns ↔ Keywords: `?campaign={id}` / `?keyword={kw}`
- Keywords ↔ Products: `?keyword={kw}`

Filter badges appear at top with "X" clear buttons.

## Key Patterns

### Data Tables

All analytics pages use TanStack Table with shadcn-svelte:

```typescript
import { createSvelteTable, FlexRender, renderSnippet } from '$lib/components/ui/data-table';
```

- `renderSnippet()` for custom cell/header rendering with Svelte snippets
- Sortable headers with arrow icons
- Pagination with page size selector (25/50/75/100/All)
- Column filtering via `getFilteredRowModel()`

### Badge Conventions

- **ROAS:** green >= 100%, red < 100%
- **CTR:** green >= 2%, red < 2%
- **Category colors:** Baby Care `#A8E6CF`, Household Care `#B0BEC5`, Family Care `#FFD54F`, other `#CE93D8`
- **Confidence:** High (default), Medium (secondary), Low (outline)
- **Asset Type:** Search (secondary), Listing (outline)

### File Upload (`src/lib/server/services/excelImporter.ts`)

- Auto-detects type from filename ("Report" or "Sellout")
- Maps subcategories → parent categories
- Extracts month from filename for reportDate
- Batch inserts (500 records)

## Svelte MCP Tools

Use the Svelte MCP server for documentation and code validation:

1. **list-sections** — Discover available Svelte 5/SvelteKit documentation
2. **get-documentation** — Fetch specific documentation sections
3. **svelte-autofixer** — Validate Svelte code before finalizing (always use this)

## shadcn-svelte

Install components: `bunx shadcn-svelte@latest add <component>`

Components are in `src/lib/components/ui/`. Docs: https://shadcn-svelte.com/docs/components/

## Environment Variables

Required: `DATABASE_URL` (PostgreSQL connection string), `BETTER_AUTH_SECRET`

Production extras in `ecosystem.config.cjs`: `PORT`, `HOST`, `BODY_SIZE_LIMIT`
