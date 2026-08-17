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
- MailHog UI: [http://localhost:8025](http://localhost:8025) (captured outbound email in local dev)

## Environment

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Purpose |
|----------|---------|
| `MONGODB_TARGET` | `local` or `atlas` — which URI to use (restart after change) |
| `MONGODB_URI_LOCAL` | Local Docker connection string (`pnpm docker:up`) |
| `MONGODB_URI_ATLAS` | Atlas `mongodb+srv://…` connection string |
| `MONGODB_DB_NAME` | Database name |
| `ALLOWED_ORIGINS` | CORS origins for web-based mobile shells |
| `JWT_SECRET` | Signing key for session tokens (min 32 chars) |
| `JWT_SECRET_PREVIOUS` | Optional previous key during rotation overlap |
| `PUBLIC_BRAND_PRIMARY` | Logo primary blue — very important actions (`Button` default) |
| `PUBLIC_BRAND_SECONDARY` | Logo mid blue — important actions (`variant="secondary"`) |
| `PUBLIC_BRAND_TERTIARY` | Logo light blue — less important actions (`variant="tertiary"`) |
| `MAIL_PROVIDER` | `mailhog` (default, local) or `postmark` — restart after switch |
| `SMTP_HOST` | MailHog SMTP host (`localhost`) |
| `SMTP_PORT` | MailHog SMTP port (`1025`) |
| `SMTP_FROM` | From address when `MAIL_PROVIDER=mailhog` |
| `POSTMARK_SERVER_TOKEN` | Postmark server token when `MAIL_PROVIDER=postmark` |
| `POSTMARK_FROM` | From address when `MAIL_PROVIDER=postmark` |
| `POSTMARK_MESSAGE_STREAM` | Postmark stream (default `outbound`) |
| `MAILBOX_IMAP_HOST` | Default IMAP host for mailbox connect (PrivateEmail: `mail.privateemail.com`) |
| `MAILBOX_IMAP_PORT` | Default IMAP port (`993`) |
| `MAILBOX_IMAP_SECURE` | IMAP TLS (`true` for port 993) |
| `MAILBOX_SMTP_HOST` | Default SMTP host for mailbox connect |
| `MAILBOX_SMTP_PORT` | Default SMTP port (`465` SSL or `587` STARTTLS) |
| `MAILBOX_SMTP_SECURE` | SMTP TLS mode (`true` for port 465; omit or `false` for 587) |
| `LINODE_ENDPOINT` | Linode Object Storage S3 endpoint |
| `LINODE_BUCKET` | Linode bucket name |
| `LINODE_ACCESS_KEY` | Linode access key |
| `LINODE_SECRET_KEY` | Linode secret key |
| `LINODE_REGION` | Linode region (e.g. `us-east-1`) |
| `LINODE_PUBLIC_BASE` | Public base URL for uploaded objects (no trailing slash) |

Per-user mailbox passwords are encrypted in MongoDB using `JWT_SECRET`. `SMTP_HOST` / `SMTP_PORT` are for transactional app mail (MailHog/Postmark), not the user mailbox.

Linode is used for workspace brand logos and transactional email images. When Linode is not configured, logos fall back to `static/workspace-branding/` and email images fall back to `static/email/` on the platform origin.

### Email assets (Linode)

Transactional emails (verify, password reset, 2FA, workspace notifications, mailbox outbound) load images from Linode when `LINODE_*` is set. Source files live in `static/email/` (logo, illustrations).

**Upload or refresh assets after adding or changing files in `static/email/`:**

```sh
pnpm upload:email-assets
```

This syncs every file in `static/email/` to `{LINODE_PUBLIC_BASE}/email/` (e.g. `https://your-bucket.region.linodeobjects.com/email/urixoft-logo.png`). The script also applies a bucket policy so `email/*` is publicly readable — required for Gmail and other clients to load images (Linode does not support per-object ACLs). Requires all `LINODE_*` variables in `.env`.

**Local dev without Linode:** leave `LINODE_*` empty; emails use `http://workspace.localhost:5173/email/*` from the static folder.

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
pnpm docker:up          # start MongoDB + MailHog
pnpm docker:down        # stop (keep data)
pnpm docker:down:clean  # stop and wipe volume
pnpm docker:logs        # tail MongoDB logs
pnpm docker:ps          # container status
```

MailHog captures SMTP on `localhost:1025`; open the inbox at [http://localhost:8025](http://localhost:8025).

## Scripts

```sh
pnpm check              # TypeScript + Svelte validation
pnpm build              # production build
pnpm start              # run adapter-node server (Coolify / production)
pnpm preview            # preview production build
pnpm rotate:jwt-secret  # rotate JWT signing key
pnpm upload:email-assets # sync static/email/* to Linode Object Storage
```

## Deploy (Coolify / Nixpacks)

Uses the same Nixpacks layout as `ux-platform` / `platform` (`nixpacks.toml`):

- Build: `pnpm install --frozen-lockfile` → `pnpm run build`
- Start: `NODE_ENV=production node build` on `0.0.0.0:3000`
- Adapter: `@sveltejs/adapter-node`

In Coolify, set build pack to **Nixpacks**, expose port **3000**, and configure the production env vars (see `.env.example`). Do not commit `.env`.

## Workspace packages

### Mailbox (`urixoft-workspace-mailbox`)

Per-user PrivateEmail (or any IMAP/SMTP) inbox in the workspace. Messages are read live from the mail server; credentials are encrypted in MongoDB (`user_mailbox_credentials`). Installed from the sibling `urx-workspace-mailbox` package.

```sh
pnpm workspace:mailbox:install    # copy routes, patch nav/collections/layout, update .env.example
pnpm workspace:mailbox:sync         # copy mailbox changes from this app back into the package
pnpm workspace:mailbox:uninstall  # remove package files and dependencies
```

**Connect a mailbox**

1. Sign in and open **Mailbox → Settings** at `/mailbox/settings`
2. Enter your full PrivateEmail address and mailbox password (not your Namecheap account password)
3. The app verifies IMAP + SMTP, then stores encrypted credentials

Optional host defaults in `.env` (see `.env.example` `urixoft-workspace-mailbox` block). API routes live under `/api/v1/mailbox/*` and are documented at `/docs`.

### Payroll (`urixoft-workspace-payroll`)

Workspace payroll runs and pay period tracking stored in MongoDB (`payroll_runs`). Installed from the sibling `urx-workspace-payroll` package.

```sh
pnpm workspace:payroll:install    # copy routes, patch nav/collections/layout, update .env.example
pnpm workspace:payroll:sync       # copy payroll changes from this app back into the package
pnpm workspace:payroll:uninstall  # remove package files and patches
```

Open **Payroll** at `/payroll` (workspace owners and admins). Add employees at `/payroll/employees`, then create draft pay runs at `/payroll/runs`. API routes live under `/api/v1/payroll/*` and are documented at `/docs`.

## Dev credentials

After `pnpm seed:user`:

- Email: `admin@urx.local`
- Password: `changeme123`
