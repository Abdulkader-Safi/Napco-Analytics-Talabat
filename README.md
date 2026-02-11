# Napco Analytics

Analytics dashboard for Napco National's Talabat Mart ad campaigns. Built with SvelteKit, PostgreSQL, and TanStack Table.

## Features

- **Campaign Analytics** — Performance metrics with ROAS, clicks, orders, revenue. Filter by category, date range, keyword, or product.
- **Keyword Analytics** — Keyword-level performance with cross-linking to campaigns and products.
- **Product Analytics** — Product-level metrics with category badges and campaign linking.
- **Ad Sales Forecasting** — Predict revenue, orders, and units based on historical data. Supports listing and search campaign types with seasonality and day-of-week adjustments.
- **Data Upload** — Import Excel files for report and sellout data with auto-detection and batch processing.
- **User Management** — Admin-only CRUD for managing users with role-based access.

## Tech Stack

- **Framework:** SvelteKit (Svelte 5) with adapter-node
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** better-auth (email/password + admin plugin)
- **Styling:** Tailwind CSS v4 + shadcn-svelte
- **Tables:** TanStack Table
- **Production:** PM2 + Caddy reverse proxy

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env  # Edit with your DATABASE_URL and BETTER_AUTH_SECRET

# Push database schema
bun run db:push

# Seed admin user
bun run db:seed

# Start development server
bun run dev
```

## Scripts

| Command                     | Description                                 |
| --------------------------- | ------------------------------------------- |
| `bun run dev`               | Start dev server                            |
| `bun run build`             | Build for production                        |
| `bun run check`             | Type check                                  |
| `bun run lint`              | Lint with prettier + eslint                 |
| `bun run format`            | Format code                                 |
| `bun run db:push`           | Push schema to DB                           |
| `bun run db:generate`       | Generate migrations                         |
| `bun run db:migrate`        | Run migrations                              |
| `bun run db:studio`         | Open Drizzle Studio                         |
| `bun run db:seed`           | Seed admin user                             |
| `bun run db:build-forecast` | Rebuild forecast model from DB              |
| `bun run rsync`             | Deploy code to production server            |
| `bun run setup`             | Full production setup (install, build, pm2) |

## Deployment

The app runs on a VPS behind Caddy reverse proxy at `napco.dsrpt.com.au`.

```bash
# Deploy to server
bun run rsync

# On the server
bun run setup
```

PM2 config is in `ecosystem.config.cjs` (port 4002, reads `.env` automatically).

## Forecast Model

The forecasting engine uses precomputed coefficients from historical campaign data. See [FORECAST.md](./FORECAST.md) for details.

To rebuild the model after uploading new data:

```bash
bun run db:build-forecast
```
