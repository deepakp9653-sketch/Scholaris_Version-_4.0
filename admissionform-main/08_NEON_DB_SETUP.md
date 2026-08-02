# Neon Database Setup
## Scholaris — Admission Module (Phase 1)

This file tells you exactly how to wire the project to Neon Postgres so every write
(admission records, form data, document metadata, fee records, audit logs) persists
correctly, survives serverless cold starts, and works with Prisma migrations without
connection-pool exhaustion — a common failure mode when Prisma + serverless + Neon
are combined incorrectly.

---

## 0. Security — read this first

- **Never hardcode the connection string** in `schema.prisma`, source files, or
  anything that gets committed to git. It goes in `.env` only, and `.env` is
  git-ignored.
- Both `.env` and `.env.example` files described below assume the actual secret
  lives in a local `.env` (never committed) and Vercel/host environment variables
  (production) — `.env.example` holds only placeholder values, safe to commit.
- If this credential has ever been pasted into a chat log, doc, or shared channel,
  rotate it from the Neon dashboard (Project → Settings → Reset password) before
  going to production. Update `.env` and the hosting provider's env vars after
  rotating — nothing else needs to change.

---

## 1. Get both connection strings from Neon

Neon exposes two endpoints per branch — you need both:

| Type | Hostname pattern | Used for |
|---|---|---|
| **Pooled** (PgBouncer, transaction mode) | `...-pooler.c-5.us-east-2.aws.neon.tech` | App runtime queries (Prisma Client at request time) — required for serverless/edge, where every request may open a new connection |
| **Direct** | same host, minus `-pooler` | Prisma **migrations** and schema introspection — migrations need a session-mode connection, which the pooler doesn't support reliably |

You already have the pooled string:
```
postgresql://neondb_owner:<PASSWORD>@ep-sweet-frost-ay8j4otd-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Get the direct one from the Neon dashboard → your project → **Connection Details** →
toggle "Pooled connection" **off**. It will look like:
```
postgresql://neondb_owner:<PASSWORD>@ep-sweet-frost-ay8j4otd.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
(Same hostname, just without `-pooler`.)

---

## 2. Environment files

### `.env` (local only — create this file, never commit it)

```bash
# Pooled — used by Prisma Client at runtime (app queries)
DATABASE_URL="postgresql://neondb_owner:<PASSWORD>@ep-sweet-frost-ay8j4otd-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Direct — used only by `prisma migrate` / `prisma db push`
DIRECT_URL="postgresql://neondb_owner:<PASSWORD>@ep-sweet-frost-ay8j4otd.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth (Tech Spec §2 — auth/session)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# S3-compatible storage (Tech Spec §2 — document uploads)
S3_ENDPOINT=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME="scholaris-documents"

# Field-level encryption key for Aadhar/APAAR (Rules doc §8)
FIELD_ENCRYPTION_KEY="generate-32-byte-key-do-not-reuse-nextauth-secret"
```

### `.env.example` (commit this — placeholders only)

```bash
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://user:password@host.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require"
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
S3_ENDPOINT=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME=""
FIELD_ENCRYPTION_KEY=""
```

### `.gitignore` — confirm this line exists

```
.env
.env*.local
```

---

## 3. Prisma schema — datasource block

In `apps/web/prisma/schema.prisma`, the datasource **must** declare both URLs:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled — runtime
  directUrl = env("DIRECT_URL")     // direct — migrations only
}

generator client {
  provider = "prisma-client-js"
}
```

Without `directUrl`, `prisma migrate dev` / `prisma migrate deploy` will intermittently
fail or hang against a pooled Neon connection — this is the single most common Neon +
Prisma misconfiguration. Do not skip it.

---

## 4. Prisma Client singleton (required for Next.js + serverless)

Next.js hot-reloads modules in dev and serverless functions may spin up fresh
processes in prod — without a singleton, you exhaust Neon's connection limit almost
immediately. Create `apps/web/lib/db/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Import `prisma` from this file everywhere — never instantiate `new PrismaClient()`
inside a Server Action, API route, or component directly.

---

## 5. Connection pool sizing

Neon's pooler defaults are usually fine for a single-pilot-tenant deployment, but if
you see `too many connections` errors under load, append a pool size hint to
`DATABASE_URL` (not `DIRECT_URL`):

```
...neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connection_limit=10
```

`connection_limit` caps how many connections *this* Prisma Client instance opens —
appropriate for a front-desk-laptop-scale pilot (Tech Spec's stated usage pattern).
Raise it only if you see pool-exhaustion errors in logs, not preemptively.

---

## 6. Running migrations against Neon

```bash
# from apps/web/
npx prisma generate
npx prisma migrate dev --name init          # local dev: creates + applies migration
npx prisma migrate deploy                   # production: applies existing migrations only
npx prisma db seed                          # seeds Institution row + 18 ChecklistItem rows
```

`migrate dev` uses `DIRECT_URL` automatically once step 3's schema block is in place —
no extra flags needed.

---

## 7. Verifying the connection works

```bash
npx prisma studio
```
This opens a local GUI against Neon directly — if it loads and shows your tables
(once migrated), the connection is correctly configured end-to-end. This is also the
fastest way to eyeball that `AdmissionRecord`, `StudentProfile`, and the 5 form
tables are actually persisting data during manual testing, before wiring up the full
UI.

---

## 8. Deploying (Vercel, per Tech Spec §2 hosting recommendation)

- Add `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (set to the
  production domain), and the S3 + encryption-key vars in **Vercel → Project →
  Settings → Environment Variables** — never in `vercel.json` or any committed file.
- Neon's pooled endpoint is specifically designed for exactly this kind of
  serverless/edge deployment target — no additional pooling middleware (e.g.
  PgBouncer sidecar) is needed on top of it.
- Run `prisma migrate deploy` as part of your deploy step (e.g., a Vercel Build
  Command override or a manual step before promoting), not `migrate dev` — `dev`
  can prompt interactively and shouldn't run in CI/CD.

---

## 9. Data-integrity checklist specific to Neon (tie-in to Rules doc §8)

- Neon's `sslmode=require` is already present in both connection strings above —
  do not remove it; unencrypted connections are not supported by Neon's pooler and
  will simply fail, not silently degrade.
- `pgcrypto` (used for Aadhar/APAAR encryption-at-rest, per Rules doc §8) is
  available on Neon by default — enable it once per database:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  ```
  Run this once via `prisma db execute` or directly in Neon's SQL editor before
  the first migration that touches encrypted columns.
- Neon autosuspends idle compute on the free/dev tier — the **first** query after
  an idle period will be slower (cold start, ~1-2s). This is expected and does not
  violate the PRD's <2s preview/print target once the compute is warm; if it
  becomes a problem for the front-desk pilot, upgrade to a Neon plan with
  always-on compute rather than trying to engineer around cold starts in app code.
