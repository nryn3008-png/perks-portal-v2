# CLAUDE.md — Bridge Perks Portal v2

> Comprehensive project reference for AI-assisted development.
> Last updated: February 2025

---

## Important: Context Preservation

**Before context compaction or when running low on context, always update this file (CLAUDE.md) with any new information about the project — new features, changed files, updated schemas, modified APIs, new conventions, etc. This ensures context is never lost between sessions.**

---

## Project Overview

**Bridge Perks Portal** is a white-labeled SaaS portal giving VC-backed startup founders exclusive access to vendor perks and discounts. Access is gated by domain — users must belong to a whitelisted VC firm or portfolio company to view and redeem offers.

- **Name:** `perks-portal-user` v0.1.0
- **Framework:** Next.js 14.2.0 (App Router) + React 18 + TypeScript 5.3 (strict)
- **Port:** 3002 (dev + prod)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.0 (App Router, RSC) |
| Language | TypeScript 5.3.3 (strict mode) |
| Styling | Tailwind CSS 3.4.1 + MercuryOS design system |
| Icons | Lucide React 0.344.0 |
| Charts | Recharts 3.7.0 |
| Database | Supabase (`@supabase/supabase-js` 2.93.3) |
| Utilities | clsx 2.1.0 |
| Font | Mulish (Google Fonts, `--font-mulish`) |

---

## Commands

```bash
npm run dev          # Dev server on port 3002
npm run build        # Production build
npm start            # Prod server on port 3002
npm run lint         # ESLint
npm run type-check   # tsc --noEmit (strict)
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                     # Root layout (Mulish font, metadata)
│   ├── (dashboard)/                   # Protected route group
│   │   ├── layout.tsx                 # Dashboard shell (auth, nav, footer)
│   │   ├── page.tsx                   # / → redirects to /perks
│   │   ├── perks/                     # Perk list + detail pages
│   │   └── admin/                     # Admin pages (whitelist, vendors, analytics, etc.)
│   ├── api/                           # API routes (see below)
│   └── login/page.tsx                 # API key login (non-Bridge domains)
├── components/
│   ├── layout/                        # App shell, nav, footer, context
│   ├── perks/                         # Offer cards, grids, filters
│   ├── admin/                         # Tables, charts, filters, export
│   ├── vendors/                       # Vendor cards, grids
│   ├── ui/                            # Primitives (button, card, input, badge, disclosure)
│   ├── access-gate.tsx                # Domain scanning animation (8s conveyor)
│   ├── access-restricted.tsx          # Access denied + request form
│   └── landing-page.tsx               # Unauthenticated landing
├── lib/
│   ├── api/                           # Service layer (GetProven client, access, whitelist, etc.)
│   ├── bridge/auth.ts                 # Auth resolver (resolveAuth, requireAdmin, isProviderOwner)
│   ├── providers.ts                   # Provider CRUD (Supabase)
│   ├── supabase-server.ts             # Server-side admin client (bypasses RLS)
│   ├── logger.ts                      # Dev-only logging (info/debug/warn in dev, errors always)
│   └── utils/                         # cn(), format helpers
├── types/                             # Central types (perk, api, user, access, changelog)
├── middleware.ts                       # Edge auth (see Auth section)
└── styles/globals.css                  # MercuryOS CSS design system
```

---

## Authentication

### Two Auth Modes

1. **Bridge cookie** (production `*.brdg.app`) — `authToken` cookie IS the Bearer token
2. **API key** (dev/non-Bridge) — user pastes key at `/login`, stored as `bridge_api_key` HttpOnly cookie

Both call `GET /api/v4/users/me` with `Authorization: Bearer {token}` to resolve identity.

### Middleware Flow

```
Request → Public route? → Allow
        → BYPASS_AUTH? → Mock user
        → authToken cookie? → Resolve via Bridge API → Set x-user-* headers
        → bridge_api_key cookie? → Resolve via Bridge API → Set x-user-* headers
        → No auth → 401 / redirect to login
```

### Admin Access

- `ADMIN_EMAIL_ALLOWLIST=connor@brdg.app` — only this email has admin
- `ADMIN_DOMAIN_ALLOWLIST=` — empty (entire `@brdg.app` is NOT admin)
- If neither env var is set, all authenticated users get admin

### Provider-Level Access (Community Owner)

- `owner_email` field on `providers` table allows non-admin users to manage a specific provider's whitelist
- `isProviderOwner()` in `src/lib/bridge/auth.ts` checks primary email + connected accounts
- Whitelist domains API grants access to admins AND provider owners, returns `isOwner` flag

---

## Access Control System

Priority chain for perk access:

```
1. Admin? → GRANTED (admin)
2. Domain is whitelisted VC? → GRANTED (vc_team)
3. Domain in VC's portfolio? → GRANTED (portfolio_match)
4. Approved manual request? → GRANTED (manual_grant)
5. None → DENIED
```

Cached in `perks_access` cookie (base64 JSON, re-checked hourly).

### Access Gate Animation
- 8s scanning phase (VC favicon conveyor) → 2.5s granted screen → perks list
- Cookie-controlled: plays once per login, skipped on reload/reduced-motion/personal-email

---

## API Routes

### Auth
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Validate Bridge API key, set cookie |
| POST | `/api/auth/logout` | Clear auth cookie |

### Perks
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/perks` | Paginated perk list |
| GET | `/api/perks/[id]` | Single perk detail |
| GET | `/api/perks/filters` | Filter options |
| GET | `/api/perks/totals` | Count/value totals |
| POST | `/api/perks/sync-new` | Sync from GetProven (admin) |

### Vendors
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/vendors` | Paginated vendor list |
| GET | `/api/vendors/[id]` | Vendor detail |
| GET | `/api/vendors/[id]/clients` | Vendor clients |
| GET | `/api/vendors/[id]/contacts` | Vendor contacts |
| POST | `/api/vendors/sync` | Sync from GetProven |

### Providers
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/providers` | List/create providers (incl. owner_email) |
| GET/PATCH/DELETE | `/api/providers/[id]` | Provider CRUD |

### Access Control
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/access-request` | User access requests |
| POST | `/api/access/resolve` | Full access check + cookie |
| GET | `/api/access/status` | Current status from cookie |
| POST | `/api/access/animation-shown` | Mark animation shown |

### Admin
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/admin/whitelist/domains` | Whitelist domains (admin OR owner) |
| POST | `/api/admin/whitelist/upload` | CSV bulk upload |
| GET/POST | `/api/admin/whitelist/individual-access` | Manual access grants |
| GET/PATCH | `/api/admin/access-requests` | Review access requests |
| GET | `/api/admin/analytics` | Redemption analytics |
| GET | `/api/admin/changelog` | Audit log entries |

---

## External Integrations

### GetProven API
- **Auth:** `Authorization: Token {api_token}` (from provider record)
- **Base URL:** Per provider config (e.g. `https://bridge.getproven.com/api/ext/v1`)
- **Whitelist API returns only:** `id`, `domain`, `offer_categories`, `investment_level`, `is_visible` (no dates/emails/vendor)
- **CSV upload format:** `domain,offer_categories,email1,email2,...` (emails in separate columns)
- **Upload endpoint:** `/whitelist/domains/upload/` (NOT `/whitelist/domain/upload/`)

### Bridge API
- **Base URL:** `https://api.brdg.app`
- `/api/v4/users/me` — Identity + connected accounts
- `/api/v4/search/network_portfolios?domain={vc}` — Portfolio lookup

### Supabase
- Server-side admin client via `createSupabaseAdmin()` (bypasses RLS)
- **Tables:** `providers`, `access_requests`, `redemptions`, `admin_changelog`

---

## Database Schema

### `providers`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `name`, `slug` | text | Display name, URL identifier |
| `api_url`, `api_token` | text | GetProven API config |
| `is_active`, `is_default` | boolean | Provider state |
| `owner_email` | text (nullable) | Community owner for provider-level access |

### `access_requests`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `user_id`, `user_email`, `user_name` | text | Requestor |
| `company_name`, `vc_name` | text | Context |
| `status` | enum | `pending` / `approved` / `rejected` |
| `reviewed_by`, `reviewed_at` | text/timestamp | Admin review |

### `redemptions`
| Column | Type | Purpose |
|--------|------|---------|
| `offer_id`, `user_id` | text | What was redeemed by whom |
| `timestamp` | timestamp | When |

### `admin_changelog`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `admin_id`, `admin_email` | text | Who |
| `action`, `entity_type` | text | What type of action |
| `summary` | text | Human-readable description |
| `details` | jsonb | Action-specific metadata |

---

## Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `GETPROVEN_API_TOKEN` | GetProven API auth | Server |
| `GETPROVEN_API_URL` | GetProven base URL | Server |
| `BRIDGE_API_BASE_URL` | Bridge API URL | Server |
| `BRIDGE_API_KEY` | Bridge intropath data | Server |
| `ADMIN_EMAIL_ALLOWLIST` | Admin emails (currently `connor@brdg.app`) | Server |
| `ADMIN_DOMAIN_ALLOWLIST` | Admin domains (currently empty) | Server |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin (bypasses RLS) | Server |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Public |
| `NEXT_PUBLIC_ENABLE_ADMIN` | Show admin UI | Public |
| `BYPASS_AUTH` | Skip auth (dev only, NEVER in prod) | Server |
| `DEV_USER_EMAIL` | Mock user when BYPASS_AUTH=true | Server |

---

## CSV Upload (Whitelist)

Full-featured upload modal at `/admin/whitelist`:

1. **Drag-drop** file selection (CSV only, max 5MB)
2. **Client-side validation** — domain format, email format, rejects booleans in email columns
3. **Preview** — green success or red error list with per-row issues
4. **Confirmation** — "Bulk Whitelisting Confirmation" showing counts
5. **Upload** → proxied to GetProven `/whitelist/domains/upload/`

**CSV format:** `domain,offer_categories,email1,email2,...` (one email per column, NOT comma-separated)

---

## Design System

### Bridge Design Tokens (admin UI)
| Token | Hex | Usage |
|-------|-----|-------|
| Royal Blue | `#0038FF` | Primary buttons, links |
| Royal Hover | `#0036D7` | Button hover |
| Charcoal | `#0D1531` | Primary text |
| Slate | `#676C7E` | Secondary text |
| Mist | `#81879C` | Tertiary text |
| Cloud/Fog | `#F2F3F5`/`#F9F9FA` | Backgrounds |
| Border | `#ECEDF0` | Borders |
| Kelly Green | `#0EA02E` | Success |
| Ruby Red | `#E13535` | Error |

### MercuryOS Tailwind (perks UI)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary-500` | `#8b5cf6` | Actions, buttons |
| `neutral-900` | `#171717` | Primary text |
| `success-500` | `#22c55e` | Success |
| `error-500` | `#ef4444` | Error |

---

## Skills (`.claude/skills/`)

| Skill | When to use |
|-------|-------------|
| `bridge-design-system` | ANY UI implementation — exact design tokens |
| `frontend-developer` | Building/coding UI from designs |
| `backend-developer` | APIs, databases, auth, integrations |
| `code-quality` | EVERY coding task — enforces standards |
| `code-reviewer` | Security, performance, convention checks |
| `ui-designer` | Visual design, layout, component styling |
| `ux-consultant` | UX audits, heuristic evaluation |
| `ux-copywriter` | UI copy, microcopy, error messages |
| `accessibility-specialist` | WCAG AA compliance, a11y patterns |

---

## Conventions

- **Path alias:** `@/*` → `./src/*`
- **Server components by default** — `'use client'` only when needed
- **API routes:** `NextResponse.json()` with proper status codes
- **Error handling:** Try/catch with structured `{ error: { code, message, status } }`
- **Logging:** `logger.ts` — `info`/`debug`/`warn` dev-only, `error` always
- **Class merging:** `cn()` utility (clsx-based)
- **Data normalization:** `normalizers/getproven.ts` for raw API → internal types
- **Cookies:** `authToken` (Bridge), `bridge_api_key` (API key), `perks_access` (access cache)
- **Auth functions:** `resolveAuth()` basic, `resolveAuthWithAccounts()` full connected accounts, `requireAdmin()` admin-only, `isProviderOwner()` provider-level

---

## Current Development Focus

### Recently Completed
- Provider owner access (`owner_email` + `isProviderOwner()`)
- CSV upload modal with client-side validation, format help, confirmation step
- Admin audit logs (`admin_changelog` + `/admin/changelog` page)
- Admin access restricted to `connor@brdg.app` only
- Access gate animation (8s scanning + 2.5s granted)
- Royal Blue design system migration

### Pending / Known Issues
- **Supabase migration needed:** `ALTER TABLE providers ADD COLUMN owner_email TEXT;` (if not already run)
- **`owner_email` must be set** on default provider via `/admin/providers` for provider-level access to work
- GetProven whitelist API only returns 5 fields (no dates/emails/vendor) — enhanced table columns not possible via external API

---

## Gotchas & Warnings

1. **GetProven endpoint path:** Upload is `/whitelist/domains/upload/` (plural `domains`), NOT `/whitelist/domain/upload/`
2. **CSV email columns:** Emails go in separate columns (3+), NOT comma-separated in one column. Booleans like `TRUE`/`FALSE` in email columns cause 400 errors.
3. **Lucide icon names:** v0.344.0 uses `UploadCloud` not `CloudUpload`
4. **Cookie writes in RSC:** `cookies().set()` doesn't work in Server Components — must use Route Handlers (see `/api/access/resolve`)
5. **Admin check inspects connected accounts:** A user with Gmail primary email but connected `@brdg.app` work email will match domain allowlist
6. **Supabase admin client:** Always use `createSupabaseAdmin()` with service role key — standard client respects RLS
7. **API caching disabled:** All API routes have `no-store` headers + `cacheMaxMemorySize: 0` in next.config.js
8. **`perks_access` cookie self-healing:** If cached cookie has domain grant but missing `matchedDomain`, `resolveAccess()` forces fresh check
