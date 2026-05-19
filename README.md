# Rev Multimedia Academy Platform

Backend and infrastructure foundation for the Rev Multimedia Academy admissions platform — handling applications, payments, student records, and admin operations. This is not an LMS; there is no course content or assignment delivery on this platform.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Cloudflare account (R2 object storage)
- Upstash account (Redis cache and rate limiting)
- Resend account (transactional email)

## Setup

1. Clone the repository and install dependencies:

   ```bash
   pnpm install
   ```

2. Copy environment variables and fill in your credentials:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with values for Supabase, Upstash, R2, Resend, Paystack, and optional Sent.dm.

3. Apply database migrations (local or linked Supabase project):

   ```bash
   supabase db push
   ```

   Run the SQL files in `supabase/functions/` on your database (or add them as additional migrations) to create RPC functions.

4. Start the development server:

   ```bash
   pnpm dev
   ```

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `pnpm dev`    | Start Next.js dev server |
| `pnpm build`  | Production build         |
| `pnpm lint`   | Run ESLint               |

## Build order

Phase 1 (this repo state) covers migrations, RLS, Redis, R2 presign, notification stubs, Paystack webhook, and API route stubs. Later phases add UI, application flows, admin tools, and the public site. See [CURSOR_RULES.md](./CURSOR_RULES.md) Section 14 for the full phased build plan.

## Scaffold command

The project was initialised to match:

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
```
