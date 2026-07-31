# Urixoft Workspace

SvelteKit + MongoDB workspace template with versioned JSON API, Scalar docs, and mobile-ready auth.

## Quick start

```sh
cp .env.example .env
pnpm install
pnpm docker:up    # local MongoDB (database: urx-workspace)
pnpm seed:user    # optional dev user
pnpm dev
```

- App: [http://localhost:5173](http://localhost:5173)
- API docs: [http://localhost:5173/docs](http://localhost:5173/docs)
- Health: [http://localhost:5173/api/v1/health](http://localhost:5173/api/v1/health)

## Environment

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB_NAME` | Database name |
| `ALLOWED_ORIGINS` | CORS origins for web-based mobile shells |
| `JWT_SECRET` | Signing key for session tokens (min 32 chars) |
| `JWT_SECRET_PREVIOUS` | Optional previous key during rotation overlap |
| `PUBLIC_BRAND_PRIMARY` | Logo primary blue — very important actions (`Button` default) |
| `PUBLIC_BRAND_SECONDARY` | Logo mid blue — important actions (`variant="secondary"`) |
| `PUBLIC_BRAND_TERTIARY` | Logo light blue — less important actions (`variant="tertiary"`) |

### Brand colors

Three colors are derived from the Urixoft logo and drive UI emphasis:

| Swatch | Default | Button variant | Use for |
|--------|---------|----------------|---------|
| Primary | `#0471B7` | `default` | Main CTAs, submit, confirm |
| Secondary | `#2A93CF` | `secondary` | Supporting actions |
| Tertiary | `#C8E6F7` | `tertiary` | Low-emphasis actions |

Set hex values in `.env` (must include `#`). Restart the dev server after changes — `PUBLIC_*` vars are read at build/start time.

```svelte
<Button>Save changes</Button>
<Button variant="secondary">Export</Button>
<Button variant="tertiary">Learn more</Button>
```

Foreground text on each swatch is chosen automatically for contrast.

## Docker

```sh
pnpm docker:up          # start MongoDB
pnpm docker:down        # stop (keep data)
pnpm docker:down:clean  # stop and wipe volume
pnpm docker:logs        # tail MongoDB logs
pnpm docker:ps          # container status
```

## Scripts

```sh
pnpm check              # TypeScript + Svelte validation
pnpm build              # production build
pnpm preview            # preview production build
pnpm rotate:jwt-secret  # rotate JWT signing key
```

## Dev credentials

After `pnpm seed:user`:

- Email: `admin@urx.local`
- Password: `changeme123`
