# PulseCheck

Uptime and health-check monitoring for websites and APIs. Register, add an
endpoint, and PulseCheck runs real HTTP checks — recording response time, uptime
history, and incidents — plus a shareable public status page.

This repo is **Phase 1 (Functional MVP)**.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth + Postgres) · Zod · Recharts · Vitest
- **Scheduler:** GitHub Actions workflow that calls a secret-protected cron endpoint
- **Deploy target:** Vercel

---

## Features

| Area | What works |
| --- | --- |
| Auth | Email + password register / login / logout, protected dashboard routes |
| Monitors | Create, edit, delete, list; fixed automatic check interval |
| Checks | Manual "Check now" + scheduled checks; timeout, redirect cap, response timing |
| History | Per-monitor uptime %, response-time chart, recent checks table, incident log |
| Incidents | Two consecutive failures open an incident; one success resolves it |
| Status page | Public, no login, per workspace slug at `/status/<slug>` |
| Security | SSRF URL allow-list, request timeouts, redirect limit, monitor cap, RLS, generic errors |

---

## Getting started

### 1. Prerequisites

- Node.js 20.9+ (tested on 24)
- A free [Supabase](https://supabase.com) project
- npm

### 2. Install

```bash
npm install
```

### 3. Create the database

In the Supabase dashboard, open **SQL Editor** and run the three migration files
in order:

1. `supabase/migrations/0001_init.sql` — tables + indexes
2. `supabase/migrations/0002_rls.sql` — row-level security policies
3. `supabase/migrations/0003_triggers.sql` — auto-create a profile + status-page slug on sign-up

(Or, with the Supabase CLI linked to your project: `supabase db push`.)

### 4. Configure auth

**Authentication → Providers → Email**: for Phase 1, turn **"Confirm email" off**
so new accounts can sign in immediately. (The `/auth/callback` route already
handles the confirmation link if you'd rather leave it on.)

**Authentication → URL Configuration**: set **Site URL** to your app URL
(`http://localhost:3000` locally) and add it to **Redirect URLs**.

### 5. Environment variables

```bash
cp .env.example .env.local
```

Fill in from **Supabase → Project Settings → API**:

| Variable | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` secret — **server only** |
| `CRON_SECRET` | any long random string, e.g. `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally |

### 6. Run

```bash
npm run dev
```

Open <http://localhost:3000>, register, and add a monitor.

### 7. (Optional) Seed a demo status page

Populates a public demo account so `/status/demo` has data:

```bash
npm run seed
```

Signs in as `demo@pulsecheck.local` / `pulsecheck-demo-1234`.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Vitest suite (URL validation, check engine, stats, incident logic, schemas) |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run seed` | Seed the demo account |

---

## How checks work

For each check PulseCheck:

1. Re-validates the URL against the SSRF rules (below).
2. Sends a `GET` with an `AbortController` timeout (default 10s, max 30s).
3. Follows at most **3** redirects, re-validating every hop.
4. Measures wall-clock response time.
5. Marks **up** only if a response arrives in time **and** the status code equals
   the monitor's expected code; otherwise **down** with a reason
   (`Request timed out`, `DNS resolution failed`, `Connection refused`,
   `Unexpected status code: N`, `Too many redirects`, `Address not allowed`, …).
6. Stores the result, updates the monitor's live status, and advances the
   incident state machine: **2 consecutive `down` checks open an incident**
   (dated to the first failure); **1 `up` check resolves it**.

---

## Scheduled checks (GitHub Actions)

`.github/workflows/cron.yml` runs every 10 minutes and `POST`s to
`/api/cron/check-monitors` with `Authorization: Bearer $CRON_SECRET`. The endpoint
uses the Supabase service-role key and checks every monitor whose last check is
older than the interval.

After deploying, add two **repository secrets** (Settings → Secrets and variables
→ Actions):

- `PULSECHECK_SITE_URL` — deployed base URL, no trailing slash
- `PULSECHECK_CRON_SECRET` — the same value as `CRON_SECRET` in the app env

Trigger it once manually from the **Actions** tab ("Run workflow") to verify.
GitHub's scheduler can lag a few minutes under load — fine for a 10-minute cadence.

> Prefer Vercel Cron? Add a `vercel.json` with a `crons` entry hitting the same
> path; the endpoint is identical.

---

## Deploying to Vercel

1. Push to GitHub, then **Import Project** in Vercel.
2. Add all five env vars (set `NEXT_PUBLIC_SITE_URL` to the Vercel URL).
3. In Supabase auth settings, add the Vercel URL to **Site URL** / **Redirect URLs**.
4. Deploy.
5. Add the two GitHub Actions secrets and run the workflow once.
6. Confirm new rows appear in `monitor_checks`.

---

## Security notes

Users submit URLs the server will request, so URL handling is the main attack
surface. Phase 1:

- **Scheme allow-list** — only `http://` and `https://`.
- **SSRF address filter** (`src/lib/validation/url.ts`) — rejects `localhost`,
  `*.internal`/`*.local`, and any hostname that resolves to loopback, private
  (`10/8`, `172.16/12`, `192.168/16`), link-local (`169.254/16`, incl. cloud
  metadata), CGNAT, unique-local IPv6, or unspecified addresses. IP literals are
  checked directly; hostnames are resolved and every answer is checked. The check
  runs again before each request and for every redirect target.
- **Timeouts** — enforced with `AbortController`, capped at 30s.
- **Redirects** — followed manually, max 3.
- **Monitor cap** — 20 per user.
- **Auth required** to create/modify monitors; all inputs validated with Zod.
- **Row-level security** — users can only read/write their own monitors, checks,
  and incidents; the status page gets a narrow public-read policy for
  `is_public` rows. The cron job uses the service-role key, which bypasses RLS.
- **Errors** — internal errors are logged server-side; clients get generic messages.

Known Phase 2 hardening: pin the vetted IP to the actual socket connection to
fully close the DNS-rebinding (TOCTOU) gap between resolve and fetch.

---

## Project layout

```
src/
  app/
    (dashboard)/            protected: dashboard, monitors/new, monitors/[id], .../edit
    api/                    monitors CRUD, /check, /checks, /incidents, /cron, /status
    auth/                   callback + sign-out route handlers
    login/  register/       auth pages
    status/[slug]/          public status page
  components/               ui primitives, dashboard widgets, auth forms
  lib/
    supabase/               browser / server / admin / anon clients + Database types
    validation/             SSRF URL check + Zod schemas
    monitor/                check engine, persistence + incident state machine, stats
    dashboard.ts status.ts monitor-detail.ts   page data loaders
  proxy.ts                  session refresh + route protection (Next 16 middleware)
supabase/migrations/        0001 schema · 0002 RLS · 0003 trigger
scripts/seed.ts             demo account seeder
tests/                      Vitest
```

---

## Testing

```bash
npm test
```

Covers: invalid / private / localhost URLs are rejected, a matching status is
`up`, a wrong status / timeout / DNS failure is `down`, redirect re-validation,
uptime and average-response math, two failures open exactly one incident, a
recovery resolves it, and schema validation of the monitor form.
