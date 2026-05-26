# Security conventions (Rev Multimedia)

This document describes how user input and outbound security controls work in this codebase. Follow these patterns when adding features.

## Database access

- Use the **Supabase JS client** only (`.from()`, `.insert()`, `.eq()`, `.in()`, `.rpc()`). Do not concatenate user input into SQL strings in application code.
- Migrations in `supabase/migrations/` are static DDL/DML, not runtime user input.
- Prefer **`.in(column, array)`** over building PostgREST `.or()` filter strings from user-supplied values.

## Validating input (before storage)

1. Define a **Zod schema** in `lib/validations/` (length limits, enums, UUIDs, email format).
2. Parse at the server boundary (Server Action, Route Handler, or RPC caller).
3. For plain text fields, run **`sanitizePlainText()`** from `lib/security/html.ts` before insert.
4. For admin rich text (curriculum, HTML descriptions), run **`sanitizeRichHtml()`** before save.
5. For file metadata, use **`sanitizeFileName()`** and whitelisted **`APPLICATION_DOCUMENT_TYPES`** (`lib/security/files.ts`).
6. For redirect query params, use **`sanitizeRedirectPath()`** (portal paths only).

## Displaying user-generated content

- **Plain text in React**: use `{value}` in JSX (React escapes HTML by default).
- **Rich HTML**: render only through **`SanitizedHtml`** (DOMPurify allowlist in `lib/security/html.ts`).
- **Email HTML**: interpolate user data only via **`escapeHtml()`** (`lib/security/html.ts` / `lib/notifications/email-components.ts`).

## HTTP security headers

Applied on every response in **`proxy.ts`** via `applySecurityHeaders()` (`lib/security/headers.ts`):

- Content-Security-Policy (third-party: Fontshare, Google Fonts, YouTube/Vimeo embeds, Paystack, Supabase, Sentry, R2 public bucket)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`, `Permissions-Policy`, HSTS (production)

When adding a new third-party script or API domain, update **`buildContentSecurityPolicy()`** in `lib/security/headers.ts`.

## Abuse protection (public forms)

`lib/security/abuse.ts` — used by **apply** and **contact** submissions:

1. **Burst limit** — more than 10 submissions per minute per IP or email (`formBurstLimit`) → temporary block.
2. **Attack patterns** — script tags, common SQL-injection phrases, or fields over 20k chars → log `[abuse-blocked]` and reject (generic error).
3. **Honeypot** — hidden `website` field; bots that fill it are rejected silently.

Hourly limits (`applySubmitLimit`, etc.) remain separate.

## Rate limiting (Upstash Redis)

Limiters live in **`lib/redis/ratelimit.ts`**. Use **`rateLimitOrNull()`** in Route Handlers or **`checkRateLimit()`** in Server Actions.

| Limiter | Scope | Typical use |
|--------|--------|-------------|
| `otpSendLimit` | email + IP | `/api/otp/send` |
| `otpVerifyEmailLimit` + `loginLimit` | email + IP | `/api/otp/verify` |
| `formBurstLimit` | IP + email | apply + contact (10/min) |
| `applySubmitLimit` | IP + email | `submitApplication` |
| `applicationSubmitLimit` | IP | contact form |
| `applicationUploadLimit` | IP | `/api/r2/presign`, `upload`, `confirm` (apply drafts) |
| `publicSearchLimit` | IP | `/api/search/courses` |
| `loginLimit` | IP | login actions |
| `passwordResetLimit` | IP | password reset |

## File uploads

- Validate MIME type and size on the server (`app/api/r2/presign/route.ts`, `app/api/r2/upload/route.ts`).
- Presigned keys must match `uploadContext` (draft ID, document type enum).
- Private bucket objects are not served directly; use presigned download URLs where needed.

## URL / query parameters

- Validate with Zod (e.g. `applySearchParamsSchema` in `lib/validations/common.ts` for `/apply?course=&intake=`).
- Never pass raw query values into HTML or SQL.

## Authentication (Supabase Auth)

- Passwords are **hashed by Supabase Auth** (GoTrue); this app never stores plain-text passwords in Postgres.
- Sessions use **httpOnly cookies** via `@supabase/ssr` and `withAuthCookieOptions()` (`secure` in production, `sameSite=lax`).
- **Do not** put service role keys, Paystack secret, or webhook secrets in client components — only `NEXT_PUBLIC_*` publishable keys belong in the browser.
- **JWT lifetime** (access ~1h, refresh ~7d by default) is configured in the [Supabase Dashboard](https://supabase.com/dashboard) → Project → Authentication → Settings (not in this repo). Target 15–30 min access / 7–30 day refresh per your policy.
- Login: `signInWithFreshSession()` clears local cookies before sign-in (session fixation mitigation); `bindSession()` stores user-agent in Redis; proxy invalidates on UA mismatch.
- Logout / password change / reset: `signOut({ scope: 'global' })` or `invalidateAllAuthSessions()` revokes refresh tokens server-side.
- Password attempts: **5 per minute** per IP and identifier (`passwordAttemptLimit`).

## Webhooks

- Paystack / FishAfrica webhooks verify signatures; they are not rate-limited like public forms but must reject invalid payloads.

## Checklist for new user-input surfaces

- [ ] Zod schema with max lengths
- [ ] Sanitize plain text or rich HTML before DB write
- [ ] Display via JSX or `SanitizedHtml` / `escapeHtml`
- [ ] Supabase parameterized API only
- [ ] Rate limit if public or abuse-prone
- [ ] Update CSP if new external origin
