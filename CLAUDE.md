# CLAUDE.md — Bridge Perks Portal v2

> Comprehensive project reference for AI-assisted development.
> Last updated: February 2025

---

## Project Overview

**Name:** `perks-portal-user`
**Version:** 0.1.0
**Framework:** Next.js 14.2.0 (App Router) + React 18 + TypeScript 5.3
**Styling:** Tailwind CSS 3.4 + MercuryOS design system
**Database:** Supabase (PostgreSQL)
**Deployment:** Vercel (port 3002)
**Primary API:** GetProven (perk/vendor data)
**Auth Provider:** Bridge (identity resolution via `*.brdg.app`)

Bridge Perks Portal is a white-labeled SaaS portal that gives VC-backed startup founders exclusive access to vendor perks and discounts. Access is gated by domain — users must belong to a whitelisted VC firm or portfolio company to view and redeem offers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.0 (App Router, RSC) |
| Language | TypeScript 5.3.3 (strict mode) |
| UI | React 18.2.0 |
| Styling | Tailwind CSS 3.4.1 + globals.css (MercuryOS) |
| Icons | Lucide React 0.344.0 |
| Charts | Recharts 3.7.0 |
| Database | Supabase (via `@supabase/supabase-js` 2.93.3) |
| Utilities | clsx 2.1.0 |
| Font | Mulish (Google Fonts, CSS variable `--font-mulish`) |
| Linting | ESLint + eslint-config-next |

---

## Scripts

```bash
npm run dev          # Start dev server on port 3002
npm run build        # Production build
npm start            # Start production server on port 3002
npm run lint         # ESLint check
npm run type-check   # TypeScript strict check (tsc --noEmit)
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout (Mulish font, metadata)
│   ├── (dashboard)/                        # Protected route group
│   │   ├── layout.tsx                      # Dashboard shell (auth, nav, footer)
│   │   ├── page.tsx                        # / → redirects to /perks
│   │   ├── perks/
│   │   │   ├── page.tsx                    # Perks list + AccessGate + landing
│   │   │   ├── perks-content.tsx           # Client component for perk list
│   │   │   └── [id]/page.tsx              # Perk detail (Mercury OS design)
│   │   └── admin/
│   │       ├── page.tsx                    # → redirects to /admin/whitelist
│   │       ├── layout.tsx                  # Admin layout (sidebar)
│   │       ├── whitelist/page.tsx          # Manage whitelisted VC domains
│   │       ├── access-requests/page.tsx    # Review access requests
│   │       ├── vendors/page.tsx            # Browse vendors
│   │       ├── vendors/[id]/page.tsx       # Vendor detail
│   │       ├── providers/page.tsx          # Manage API providers
│   │       ├── individual-access/page.tsx  # Manual user access grants
│   │       └── analytics/page.tsx          # Redemption analytics + charts
│   ├── api/                                # API routes (see API section)
│   └── login/page.tsx                      # API key login (non-Bridge domains)
├── components/
│   ├── layout/                             # App shell, nav, footer, context
│   ├── perks/                              # Offer cards, grids, filters
│   ├── admin/                              # Tables, charts, filters, export
│   ├── vendors/                            # Vendor cards, grids
│   ├── ui/                                 # Base primitives (button, card, input, badge)
│   ├── access-gate.tsx                     # Domain scanning animation (8s)
│   ├── access-restricted.tsx               # Access denied + request form
│   └── landing-page.tsx                    # Unauthenticated landing
├── lib/
│   ├── api/                                # Service layer (see Services section)
│   ├── bridge/                             # Auth utilities (resolveAuth, requireAdmin)
│   ├── providers.ts                        # Provider management (Supabase)
│   ├── supabase-server.ts                  # Server-side Supabase admin client
│   ├── supabase.ts                         # Client-side Supabase
│   ├── logger.ts                           # Server-only logging utility
│   ├── similarity.ts                       # Perk similarity matching algorithm
│   ├── constants.ts                        # App constants
│   ├── constants/featured-vcs.ts           # Featured VC list for scanner
│   ├── normalizers/getproven.ts            # API response → internal types
│   └── utils/                              # cn(), format helpers
├── types/
│   ├── index.ts                            # Central export
│   ├── perk.ts                             # Perk, PerkValue, PerkRedemption, etc.
│   ├── api.ts                              # GetProven & Bridge API types
│   ├── user.ts                             # User, AuthUser, VCFirm
│   └── access.ts                           # AccessStatus, AccessReason, AccessRequest
├── middleware.ts                            # Edge auth (see Auth section)
└── styles/globals.css                       # MercuryOS CSS design system
```

---

## Authentication

### Two Auth Modes

1. **Bridge cookie auth** (production — `*.brdg.app` domains)
   - Bridge sets `authToken` cookie on login at `brdg.app`
   - Cookie value IS the user's Bearer token
   - Middleware calls `GET /api/v4/users/me` with `Authorization: Bearer {authToken}`
   - Resolves user identity + connected email accounts

2. **API key auth** (development — localhost, vercel.app, non-Bridge domains)
   - User visits `/login` and pastes Bridge API key
   - `POST /api/auth/login` validates key, sets `bridge_api_key` HttpOnly cookie (30 days)
   - Same token resolution mechanism as above

### Middleware Flow (`src/middleware.ts`)

```
Request → Is public route? → Allow (still resolve auth if token present)
       → BYPASS_AUTH=true? → Allow with mock user (DEV_USER_EMAIL)
       → Has authToken cookie? → Resolve via Bridge API → Set x-user-* headers
       → Has bridge_api_key cookie? → Resolve via Bridge API → Set x-user-* headers
       → No auth → API routes return 401 / Pages redirect to login
```

**Headers set on authenticated requests:**
- `x-user-id` — Bridge user ID
- `x-user-email` — User's email
- `x-user-is-admin` — `"true"` or `"false"`
- `x-auth-mode` — `"cookie"`, `"api-key"`, or `"bypass"`

### Admin Access

Controlled by environment variables:
- `ADMIN_EMAIL_ALLOWLIST` — comma-separated admin emails
- `ADMIN_DOMAIN_ALLOWLIST` — comma-separated admin domains

If neither is set, all authenticated users get admin access. Admin check also inspects connected account domains (e.g., user's primary email is Gmail but has a connected `@brdg.app` work email).

---

## Access Control System

The portal gates access to perks based on the user's email domain. The access check follows a priority chain:

```
1. Admin? → GRANTED (reason: admin)
2. User's domain is a whitelisted VC? → GRANTED (reason: vc_team)
3. User's domain in a VC's portfolio? → GRANTED (reason: portfolio_match)
4. Approved manual access request? → GRANTED (reason: manual_grant)
5. None of the above → DENIED
```

### Access Gate Animation

When a user logs in and visits `/perks` for the first time:
1. **Scanning phase** (8 seconds) — animated VC favicon conveyor belt cycling through partner logos, domain chips with scan line, 8 status text phases, progress bar
2. **Granted phase** (2.5 seconds) — reason-specific success screen with color-coded badge (admin=amber, vc_team=blue, portfolio_match=emerald, manual_grant=purple), contextual description, and matched domain chip
3. **Result** — perks list or access-restricted page

**Animation control via `animationShown` cookie flag:**
- Fresh login → `animationShown` absent in cookie → animation plays → `POST /api/access/animation-shown` marks cookie
- Page reload → `animationShown: true` in cookie → animation skipped
- Logout → cookie cleared → next login plays animation again
- Personal email only (no work domains) → animation skipped entirely
- `prefers-reduced-motion` → animation skipped (accessibility)

**Reason-specific messaging:** Both the Access Granted screen (`access-gate.tsx`) and user menu dropdown (`user-menu.tsx`) display color-coded access reason badges with contextual descriptions. Access info is threaded server-side: `layout.tsx` reads `perks_access` cookie → `AppShell` → `TopNav` → `UserMenu`.

**Stale cookie self-healing:** If a cached cookie has a domain-match grant (`vc_team`/`portfolio_match`) but is missing `matchedDomain`, `resolveAccess()` forces a fresh check instead of returning the incomplete cache.

Access status is cached in `perks_access` cookie (base64 JSON, re-checked every hour).

### Manual Access Requests

Denied users can submit a manual access request form (stored in Supabase `access_requests` table). Admins review and approve/reject from `/admin/access-requests`.

---

## API Routes

### Authentication
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Validate Bridge API key, set cookie |
| POST | `/api/auth/logout` | Clear auth cookie |

### Perks
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/perks` | Paginated perk list (GetProven proxy) |
| GET | `/api/perks/[id]` | Single perk detail |
| GET | `/api/perks/filters` | Available filter options |
| GET | `/api/perks/totals` | Count/value totals for header |
| POST | `/api/perks/sync-new` | Sync new perks from GetProven (admin) |

### Vendors
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/vendors` | Paginated vendor list |
| GET | `/api/vendors/[id]` | Vendor detail |
| GET | `/api/vendors/[id]/clients` | Vendor clients |
| GET | `/api/vendors/[id]/contacts` | Vendor contacts |
| GET | `/api/vendors/filters` | Vendor filter options |
| POST | `/api/vendors/sync` | Sync vendors from GetProven |

### Providers
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/providers` | List all providers |
| GET | `/api/providers/[id]` | Provider detail |

### Access Control
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/access-request` | User's most recent access request |
| POST | `/api/access-request` | Submit manual access request |
| POST | `/api/access-request/refresh` | Re-check access, update cookie |
| GET | `/api/access/status` | Current access status from cookie (for client components) |
| POST | `/api/access/animation-shown` | Mark scanning animation as shown in cookie |

### Admin
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/whitelist/domains` | List whitelisted VC domains |
| POST | `/api/admin/whitelist/domains` | Create/update whitelist |
| GET | `/api/admin/whitelist/individual-access` | List manual access grants |
| POST | `/api/admin/whitelist/individual-access` | Grant individual access |
| POST | `/api/admin/whitelist/upload` | Bulk upload whitelist (CSV) |
| GET | `/api/admin/access-requests` | List all access requests |
| GET | `/api/admin/analytics` | Redemption analytics data |

### Other
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/user/connected-accounts` | User's connected email accounts |
| POST | `/api/track/redemption` | Track perk redemption click |
| GET | `/api/health` | Health check (GetProven + Bridge APIs) |

---

## Service Layer (`src/lib/api/`)

| File | Purpose |
|------|---------|
| `getproven-client.ts` | HTTP client for GetProven API (Bearer token, error handling) |
| `perks-service.ts` | `getOffers()`, `getOfferById()`, `getCategories()` |
| `vendors-service.ts` | `getVendors()`, `getVendorById()`, `getVendorClients()`, `getVendorContacts()` |
| `whitelist-service.ts` | `getWhitelistDomains()`, `getIndividualAccess()` |
| `access-service.ts` | `checkAccess()`, `resolveAccess()`, `markAnimationShown()`, cookie read/write |
| `access-cache.ts` | Cached whitelist & portfolio domain lookups |
| `bridge-client.ts` | Bridge API client for intropath/warm connection counts |
| `portfolio-client.ts` | Bridge portfolio fetching (`/api/v4/search/network_portfolios`) |
| `check-api-access.ts` | Middleware for API route access verification |
| `index.ts` | Central re-export for all services |

---

## External Integrations

### GetProven API
- **Base URL:** `https://provendeals.getproven.com/api/ext/v1`
- **Auth:** `Authorization: Token {GETPROVEN_API_TOKEN}`
- **Endpoints:** `/offers/`, `/categories/`, `/vendors/`, `/whitelist/domains/`, `/whitelist/individual_access/`
- **Purpose:** Primary data source for all perk/vendor data and whitelist management

### Bridge API
- **Base URL:** `https://api.brdg.app`
- **Auth:** `Authorization: Bearer {token}`
- **Endpoints:**
  - `/api/v4/users/me` — User identity resolution (middleware + login)
  - `/api/v4/search/network_portfolios?domain={vcDomain}` — Portfolio company lookup
- **Purpose:** Authentication, identity, portfolio domain matching, intropath enrichment

### Supabase
- **Tables:** `providers`, `access_requests`, `redemptions`
- **Purpose:** Provider config, access request tracking, redemption analytics
- **Client:** Server-side admin client (bypasses RLS) via `createSupabaseAdmin()`

---

## Database Schema (Supabase)

### `providers`
Bridges between the portal and GetProven API instances. Supports multi-provider architecture.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `name` | text | Provider display name |
| `slug` | text | URL-safe identifier |
| `api_url` | text | GetProven API base URL |
| `api_token` | text | GetProven API token |
| `is_active` | boolean | Whether provider is enabled |
| `is_default` | boolean | Default provider for new users |

### `access_requests`
Manual access requests from denied users.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `user_id`, `user_email`, `user_name` | text | Requestor identity |
| `company_name`, `vc_name` | text | Company/VC context |
| `vc_contact_name`, `vc_contact_email` | text | VC contact info |
| `status` | enum | `pending` / `approved` / `rejected` |
| `reviewed_by`, `reviewed_at` | text/timestamp | Admin review info |
| `created_at` | timestamp | Request timestamp |

### `redemptions`
Tracks perk redemption clicks for analytics.

| Column | Type | Purpose |
|--------|------|---------|
| `offer_id` | text | GetProven offer ID |
| `user_id` | text | Bridge user ID |
| `timestamp` | timestamp | Click timestamp |

---

## Key TypeScript Types (`src/types/`)

### Perk Models (`perk.ts`)
- `Perk` — Full perk with title, description, category, provider, value, redemption, eligibility
- `PerkListItem` — Lightweight version for list views
- `PerkCategory` — Category (id, name, slug, icon)
- `PerkProvider` — Vendor (id, name, logo, website, faviconUrl)
- `PerkValue` — Value info (type: percentage|fixed|credits|custom, amount, description)
- `PerkRedemption` — Redemption method (type: code|link|contact|form, code, url, instructions)
- `PerkEligibility` — Eligibility rules (fundingStages, maxEmployees, industries, geographies)
- `PerkStatus` — `active` | `expired` | `coming_soon` | `archived`

### API Types (`api.ts`)
- `GetProvenDeal`, `GetProvenVendor`, `GetProvenCategory` — Raw GetProven API responses
- `GetProvenListResponse<T>` — Paginated wrapper
- `WhitelistDomain`, `IndividualAccess` — Whitelist models
- `BridgeIntropathCountResponse`, `VendorIntropathData` — Bridge intropath data

### User Types (`user.ts`)
- `User` — Full user (id, email, name, role, vcFirmId)
- `AuthUser` — Lightweight auth (id, email, name, isAdmin, avatarUrl)
- `VCFirm` — VC firm info (id, name, logo, settings)
- `PortfolioCompany` — Startup (id, name, fundingStage, employeeCount)

### Access Types (`access.ts`)
- `AccessStatus` — Cookie payload (granted, reason, matchedDomain, matchedVcDomain, checkedAt, providerId, animationShown)
- `AccessReason` — `admin` | `vc_team` | `portfolio_match` | `manual_grant` | `denied`
- `AccessRequest` — Manual request model

---

## Design System (MercuryOS)

### Color Palette (Tailwind)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary-500` | `#8b5cf6` | Primary actions, buttons, links |
| `primary-600` | `#7c3aed` | Hover states |
| `primary-700` | `#6d28d9` | Active states |
| `neutral-50` | `#fafafa` | Page backgrounds |
| `neutral-100` | `#f5f5f5` | Card backgrounds |
| `neutral-500` | `#737373` | Secondary text |
| `neutral-900` | `#171717` | Primary text |
| `success-500` | `#22c55e` | Success states |
| `warning-500` | `#f59e0b` | Warning states |
| `error-500` | `#ef4444` | Error states |
| `accent-500` | `#06b6d4` | Highlights, accents |

### Typography
- **Font:** Mulish (Google Fonts) via `--font-mulish` CSS variable
- **Scale:** xs (0.75rem) through 6xl (3.75rem), all with line-height tokens

### Animations
| Name | Duration | Use |
|------|----------|-----|
| `fade-in` | 0.3s | General entrance |
| `fade-in-up` | 0.4s | Card/content entrance |
| `slide-in-right` | 0.3s | Sidebar/panel entrance |
| `slide-in-left` | 0.3s | Reverse panel entrance |
| `scale-in` | 0.2s | Modal/popover entrance |
| `glow-pulse` | 2s infinite | Accent glow effect |
| `scan-pulse-ring` | 2s infinite | Pulsating ring around scanning favicon |
| `scan-line` | 2s infinite | Horizontal scan line over domain chips |
| `scan-glow` | 1.5s infinite | Soft glow behind scanning favicon |
| `progress-fill` | 8s linear | Progress bar fill during scanning |
| `slide-in-left` | 0.5s | Favicon entering conveyor from left |
| `slide-into-scan` | 0.4s | Favicon scaling into scan circle |
| `slide-out-right` | 0.5s | Favicon exiting conveyor to right |

### Shadows
- Standard: `sm`, `DEFAULT`, `md`, `lg`, `xl`, `2xl`
- Glow: `glow` (purple 20px), `glow-lg` (purple 40px)
- Dark variants: `dark-sm`, `dark-md`, `dark-lg`

---

## Components Reference

### Layout (`src/components/layout/`)
| Component | Purpose |
|-----------|---------|
| `app-shell.tsx` | Main layout wrapper (top nav + content + footer); threads `accessInfo` to TopNav |
| `top-nav.tsx` | Navigation bar with logo, links, user menu; passes `accessInfo` to UserMenu |
| `user-menu.tsx` | User dropdown (avatar, access status badge, connected accounts, Bridge link) |
| `user-context.tsx` | React Context provider for user data |
| `layout-context.tsx` | Context for full-width mode (admin pages) |
| `header.tsx` | Page header section |
| `footer.tsx` | App footer |
| `bottom-nav.tsx` | Mobile bottom navigation |
| `api-health-badge.tsx` | Dev-only API health indicator |
| `api-status-chip.tsx` | API status display chip |

### Perks (`src/components/perks/`)
| Component | Purpose |
|-----------|---------|
| `offer-card.tsx` | Perk card (Mercury OS design, skeleton loader) |
| `offers-grid.tsx` | Grid layout for perk cards |
| `category-filter.tsx` | Category filter bar |
| `redeem-button.tsx` | CTA button with redemption tracking |
| `copy-button.tsx` | Copy promo code to clipboard |
| `vendor-icon.tsx` | Vendor logo with fallback |
| `vendor-group.tsx` | Group perks by vendor |

### Admin (`src/components/admin/`)
| Component | Purpose |
|-----------|---------|
| `redemptions-table.tsx` | Redemption click history table |
| `redemption-chart.tsx` | Recharts visualization |
| `date-range-filter.tsx` | Date range picker |
| `provider-filter.tsx` | Filter by provider |
| `export-button.tsx` | Export analytics to CSV |
| `stat-card.tsx` | Statistics display card |

### UI Primitives (`src/components/ui/`)
| Component | Purpose |
|-----------|---------|
| `button.tsx` | Base button with variants |
| `card.tsx` | Card container |
| `input.tsx` | Text input field |
| `search-input.tsx` | Search field with icon |
| `badge.tsx` | Badge/tag component |
| `disclosure.tsx` | Accordion/collapsible |

### Feature Components
| Component | Purpose |
|-----------|---------|
| `access-gate.tsx` | Domain scanning animation (8s conveyor + 2.5s reason-specific granted screen), cookie-controlled skip |
| `access-restricted.tsx` | Access denied page with domain check explanation + request form |
| `landing-page.tsx` | Unauthenticated user landing page |

---

## Environment Variables

```env
# Required
GETPROVEN_API_TOKEN=             # GetProven API auth token (server-only)
GETPROVEN_API_URL=               # GetProven base URL (default: https://provendeals.getproven.com/api/ext/v1)

# Bridge Auth (required for production)
BRIDGE_API_BASE_URL=             # Bridge API (default: https://api.brdg.app)
ADMIN_EMAIL_ALLOWLIST=           # Comma-separated admin emails
ADMIN_DOMAIN_ALLOWLIST=          # Comma-separated admin domains

# Supabase (required for access requests + analytics)
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key

# Application
NEXT_PUBLIC_APP_URL=             # Public app URL
NEXT_PUBLIC_ENABLE_ADMIN=        # Show admin UI (true/false)
NODE_ENV=                        # production / development

# Optional
BRIDGE_API_KEY=                  # Bridge API key for intropath data
USE_MOCK_DATA=                   # Use mock data fallback (dev only)
USE_MOCK_INTROPATH_DATA=         # Mock intropath data (dev only)
BYPASS_AUTH=                     # Skip auth for local dev (NEVER in production)
DEV_USER_EMAIL=                  # Mock user email when BYPASS_AUTH=true
BRIDGE_LOGIN_URL=                # Bridge login redirect URL
```

---

## Security

### Headers (via `next.config.js`)
- `X-Frame-Options: DENY` — prevent clickjacking
- `X-Content-Type-Options: nosniff` — prevent MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### API Caching
All `/api/*` routes set `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate` to prevent stale data in CDN/browser. In-memory cache disabled via `cacheMaxMemorySize: 0`.

### Cookie Security
- `authToken` — set by Bridge on `*.brdg.app` (HttpOnly, Secure in production)
- `bridge_api_key` — set by `/api/auth/login` (HttpOnly, 30-day expiry)
- `perks_access` — access status cache (base64 JSON with granted, reason, matchedDomain, matchedVcDomain, checkedAt, providerId, animationShown; re-checked hourly; cleared on logout)

---

## Image Optimization

Next.js image optimization configured for:
- `**.getproven.com` — Vendor logos from GetProven
- `www.google.com/s2/favicons**` — Google favicon service (vendor icons)
- `**.cloudfront.net` — CloudFront CDN assets

---

## Development

### Local Setup
```bash
cp .env.example .env.local       # Configure environment
npm install                       # Install dependencies
npm run dev                       # Start on http://localhost:3002
```

### Auth Bypass (Development)
Set `BYPASS_AUTH=true` and `DEV_USER_EMAIL=admin@brdg.app` in `.env.local` to skip Bridge auth. Admin check still applies (email must be in allowlists).

### Mock Data
Set `USE_MOCK_DATA=true` to use `data/perks.json` instead of GetProven API. When false, mock data only serves as fallback if API fails.

---

## Deployment (Vercel)

- **Port:** 3002
- **Region:** Auto (Vercel default)
- **Cache:** Disabled for API routes (via headers + vercel.json)
- **Image domains:** GetProven, Google Favicons, CloudFront
- **Build:** `next build` (standard Next.js)

---

## Recent Changes (Commit History Highlights)

| Feature | Description |
|---------|-------------|
| Reason-Specific Access Granted | Granted screen shows color-coded badge per access reason (admin/vc_team/portfolio_match/manual_grant) with contextual description and domain chip |
| User Menu Access Status | User dropdown shows access status section (badge + reason description) between user info and connected accounts; server-side prop threading from layout |
| Animation-Controlled Access Gate | 8s scanning animation with VC favicon conveyor + 2.5s granted screen; plays only on fresh login via `animationShown` cookie flag; skipped on reload/reduced-motion/personal-email |
| Matched Domain Display | Access Granted screen shows only the actually matched domain (not all connected domains); stale cookies self-heal via forced re-check |
| Work Email Clarification | Both scanning and restricted screens explain that connected work emails are being checked |
| Primary Service Fallback | Vendor/perk cards fall back to `services[0].name` when `primary_service` is null |
| Claude Skills | 9 skills in `.claude/skills/` for AI-assisted development |
| Multi-Provider Support | Support multiple GetProven instances via `providers` table |
| Redemption Analytics | Charts, tables, date range filters, CSV export |
| Bridge API Integration | Intropath counts, portfolio domain matching |
| MercuryOS Design System | Consistent visual language across all components |
| Landing Page | Unauthenticated user experience with CTA |
| Vendor Tracker | Admin vendor browsing, detail pages, client/contact info |
| Individual Access | Manual user access grants by admin |
| Cache Busting | Force dynamic API responses, no CDN/browser caching |
| Security Headers | HSTS, CSP, X-Frame-Options, etc. |

---

## Claude Skills (`.claude/skills/`)

| Skill | Purpose |
|-------|---------|
| `accessibility-specialist` | WCAG AA compliance, a11y patterns |
| `backend-developer` | APIs, databases, auth, integrations |
| `bridge-design-system` | Exact design tokens and implementation rules |
| `code-quality` | TypeScript strictness, engineering standards |
| `code-reviewer` | Security, performance, convention checks |
| `frontend-developer` | Pixel-perfect UI implementation |
| `ui-designer` | Visual design, layout, component styling |
| `ux-consultant` | UX audits, heuristic evaluation |
| `ux-copywriter` | UI copy, microcopy, voice/tone |

---

## Conventions

- **Path alias:** `@/*` maps to `./src/*`
- **Server components by default** — client components marked with `'use client'`
- **API routes:** All use `NextResponse.json()` with proper status codes
- **Error handling:** Try/catch with structured error responses
- **Logging:** Via `logger.ts` (server-only, dev console)
- **Class merging:** Use `cn()` utility (clsx-based)
- **Data normalization:** Raw API responses normalized via `normalizers/getproven.ts`
- **Cookie names:** `authToken` (Bridge), `bridge_api_key` (API key), `perks_access` (access cache)
