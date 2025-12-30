# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run check        # Type check with svelte-check
bun run lint         # Run prettier + eslint
bun run format       # Format code with prettier

# Database (Drizzle ORM with PostgreSQL)
bun run db:push      # Push schema to database
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

## Architecture

### Tech Stack
- **Framework:** SvelteKit with Svelte 5 (runes: `$state`, `$props`, `$derived`, `$effect`)
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** better-auth with email/password
- **Styling:** Tailwind CSS v4 + shadcn-svelte components
- **Data Tables:** TanStack Table (`@tanstack/table-core`)

### Project Structure
```
src/
├── lib/
│   ├── auth.ts              # better-auth server config
│   ├── auth-client.ts       # better-auth client
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts     # Drizzle db instance
│   │   │   └── schema.ts    # Database schema (user, session, reports, sellout)
│   │   └── services/        # Business logic (e.g., excelImporter.ts)
│   └── components/
│       ├── ui/              # shadcn-svelte components
│       ├── app-sidebar.svelte
│       └── nav-user.svelte
├── routes/
│   ├── +layout.server.ts    # Auth guard (redirects to /auth/login if not authenticated)
│   ├── auth/                # Login/signup pages
│   ├── campaigns/           # Campaign analytics with TanStack Table
│   └── upload/              # Excel file upload
└── hooks.server.ts          # Auth middleware (session handling)
```

### Database Schema
Two main data tables in `src/lib/server/db/schema.ts`:
- **reports:** Ad campaign performance data (campaigns, products, keywords, metrics like ROAS, clicks, orders)
- **sellout:** Sales data from Excel uploads

### Authentication Flow
1. `hooks.server.ts` handles auth via better-auth's `svelteKitHandler`
2. Session is attached to `event.locals.user`
3. `+layout.server.ts` redirects unauthenticated users (except `/auth/*` routes)

### Data Tables Pattern
Uses TanStack Table with shadcn-svelte Table components:
```typescript
import { createSvelteTable, FlexRender, renderSnippet } from '$lib/components/ui/data-table';
import { type Column, type ColumnDef, getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel } from '@tanstack/table-core';
```

## Svelte MCP Tools

Use the Svelte MCP server for documentation and code validation:

1. **list-sections** - Discover available Svelte 5/SvelteKit documentation
2. **get-documentation** - Fetch specific documentation sections
3. **svelte-autofixer** - Validate Svelte code before finalizing (always use this)
4. **playground-link** - Generate Svelte Playground links (ask user first)

## shadcn-svelte

Install components: `bunx shadcn-svelte@latest add <component>`

Components are in `src/lib/components/ui/`. Reference docs at https://shadcn-svelte.com/docs/components/

## Environment Variables

Required: `DATABASE_URL` (PostgreSQL connection string)
