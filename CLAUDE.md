# CLAUDE.md — Bridge Perks Portal v2

> Comprehensive project reference for AI-assisted development.
> Last updated: February 2025

---

## Important: Context Preservation

**Before context compaction or when running low on context, always update this file (CLAUDE.md) with any new information about the project — new features, changed files, updated schemas, modified APIs, new conventions, etc. This ensures context is never lost between sessions.**

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
│   │       ├── whitelist/page.tsx          # Manage whitelisted VC domains + CSV upload modal
│   │       ├── access-requests/page.tsx    # Review access requests
│   │       ├── vendors/page.tsx            # Browse vendors
│   │       ├── vendors/[id]/page.tsx       # Vendor detail
│   │       ├── providers/page.tsx          # Manage API providers (incl. owner_email)
│   │       ├── individual-access/page.tsx  # Manual user access grants
│   │       ├── analytics/page.tsx          # Redemption analytics + charts
│   │       └── changelog/page.tsx          # Admin audit logs + filtering
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
│   ├── api/                                # Service layer (see Services section, incl. changelog-service)
│   ├── bridge/                             # Auth utilities (resolveAuth, requireAdmin, isProviderOwner)
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
│   ├── access.ts                           # AccessStatus, AccessReason, AccessRequest
│   └── changelog.ts                        # ChangelogEntry, ChangelogAction, ChangelogEntityType
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
- `ADMIN_EMAIL_ALLOWLIST` — comma-separated admin emails (currently: `connor@brdg.app`)
- `ADMIN_DOMAIN_ALLOWLIST` — comma-separated admin domains (currently: empty)

If neither is set, all authenticated users get admin access. Admin check also inspects connected account domains (e.g., user's primary email is Gmail but has a connected `@brdg.app` work email).

**Current config:** Only `connor@brdg.app` has admin access. The domain allowlist is empty so the entire `@brdg.app` domain is NOT whitelisted for admin.

### Provider-Level Access (Community Owner)

In addition to admin access, the portal supports **provider-level access** via the `owner_email` field on the `providers` table. This allows a non-admin user to manage the whitelist for a specific provider community.

- `isProviderOwner()` in `src/lib/bridge/auth.ts` checks if the user's primary email OR any connected account email matches the provider's `owner_email`
- The whitelist domains route (`/api/admin/whitelist/domains`) grants access to both admins AND provider owners
- The API response includes an `isOwner` flag for frontend conditional rendering

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

**Reason-specific messaging:** Both the Access Granted screen (`access-gate.tsx`) and user menu dropdown (`user-menu.tsx`) display color-coded access reason badges with contextual descriptions. Access info for the user menu is fetched client-side via `GET /api/access/status` when the dropdown opens, ensuring the cookie has been set by the page before reading.

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
| GET | `/api/providers` | List all providers (incl. owner_email) |
| GET | `/api/providers/[id]` | Provider detail (incl. owner_email) |
| POST | `/api/providers` | Create provider (accepts owner_email) |
| PATCH | `/api/providers/[id]` | Update provider (accepts owner_email) |
| DELETE | `/api/providers/[id]` | Delete provider (cannot delete default) |

### Access Control
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/access-request` | User's most recent access request |
| POST | `/api/access-request` | Submit manual access request |
| POST | `/api/access-request/refresh` | Re-check access, update cookie |
| POST | `/api/access/resolve` | Full access check + persist cookie (Route Handler for cookie writes) |
| GET | `/api/access/status` | Current access status from cookie (for client components) |
| POST | `/api/access/animation-shown` | Mark scanning animation as shown in cookie |

### Admin
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/whitelist/domains` | List whitelisted VC domains (admin OR provider owner) |
| POST | `/api/admin/whitelist/domains` | Create/update whitelist |
| GET | `/api/admin/whitelist/individual-access` | List manual access grants |
| POST | `/api/admin/whitelist/individual-access` | Grant individual access |
| POST | `/api/admin/whitelist/upload` | Bulk upload whitelist (CSV with validation) |
| GET | `/api/admin/access-requests` | List all access requests |
| PATCH | `/api/admin/access-requests` | Approve/reject access request |
| GET | `/api/admin/analytics` | Redemption analytics data |
| GET | `/api/admin/changelog` | Paginated audit log entries (filterable) |

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
| `getproven-client.ts` | HTTP client for GetProven API (Token auth, error handling, CSV upload) |
| `perks-service.ts` | `getOffers()`, `getOfferById()`, `getCategories()` |
| `vendors-service.ts` | `getVendors()`, `getVendorById()`, `getVendorClients()`, `getVendorContacts()` |
| `whitelist-service.ts` | `getWhitelistDomains()`, `getIndividualAccess()` |
| `access-service.ts` | `checkAccess()`, `resolveAccess()`, `markAnimationShown()`, cookie read/write |
| `access-cache.ts` | Cached whitelist & portfolio domain lookups |
| `bridge-client.ts` | Bridge API client for intropath/warm connection counts |
| `portfolio-client.ts` | Bridge portfolio fetching (`/api/v4/search/network_portfolios`) |
| `changelog-service.ts` | `changelogService.log()` (fire-and-forget audit logging), `changelogService.list()` (paginated query) |
| `check-api-access.ts` | Middleware for API route access verification |
| `index.ts` | Central re-export for all services |

---

## External Integrations

### GetProven API
- **Base URL:** Per provider config (e.g. `https://bridge.getproven.com/api/ext/v1`)
- **Auth:** `Authorization: Token {api_token}` (from provider record)
- **Endpoints:** `/offers/`, `/categories/`, `/vendors/`, `/whitelist/domains/`, `/whitelist/domains/upload/`, `/whitelist/individual_access/`
- **Whitelist API fields:** `id`, `domain`, `offer_categories`, `investment_level`, `is_visible` (only these 5 fields — no dates, emails, or vendor info via external API)
- **CSV upload format:** `domain,offer_categories,email1,email2,...` (emails in separate columns, not comma-separated in one column)
- **Purpose:** Primary data source for all perk/vendor data and whitelist management

### Bridge API
- **Base URL:** `https://api.brdg.app`
- **Auth:** `Authorization: Bearer {token}`
- **Endpoints:**
  - `/api/v4/users/me` — User identity resolution (middleware + login), includes `tokens` (connected email accounts) and `network_domains`
  - `/api/v4/search/network_portfolios?domain={vcDomain}` — Portfolio company lookup
- **Purpose:** Authentication, identity, portfolio domain matching, intropath enrichment

### Supabase
- **Tables:** `providers`, `access_requests`, `redemptions`, `admin_changelog`
- **Purpose:** Provider config, access request tracking, redemption analytics, admin audit logs
- **Client:** Server-side admin client (bypasses RLS) via `createSupabaseAdmin()` using `SUPABASE_SERVICE_ROLE_KEY`

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
| `owner_email` | text (nullable) | Community owner email for provider-level access |
| `created_at` | timestamp | Auto-generated timestamp |

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

### `admin_changelog`
Audit log tracking all admin actions for compliance.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `admin_id` | text | Bridge user ID |
| `admin_email` | text | Admin's email |
| `admin_name` | text (nullable) | Admin's display name |
| `action` | text | Action type (e.g., `access_request.approve`, `offers.sync`) |
| `entity_type` | text | Entity category (`access_request`, `whitelist`, `offers`, `vendors`, `provider`) |
| `entity_id` | text (nullable) | ID of affected entity |
| `summary` | text | Human-readable description |
| `details` | jsonb (nullable) | Action-specific metadata |
| `created_at` | timestamp | Auto-generated timestamp |

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
- `GetProvenListResponse<T>` — Paginated wrapper (`count`, `next`, `previous`, `results`)
- `WhitelistDomain` — `{ id, domain, offer_categories, investment_level, is_visible }` (confirmed via API — only these 5 fields)
- `IndividualAccess` — Individual access record
- `BridgeIntropathCountResponse`, `VendorIntropathData` — Bridge intropath data

### User Types (`user.ts`)
- `User` — Full user (id, email, name, role, vcFirmId)
- `AuthUser` — Lightweight auth (id, email, name, isAdmin, avatarUrl)
- `VCFirm` — VC firm info (id, name, logo, settings)
- `PortfolioCompany` — Startup (id, name, fundingStage, employeeCount)

### Auth Types (`src/lib/bridge/auth.ts`)
- `BridgeUserProfile` — Full Bridge API user profile (id, email, name, tokens, network_domains)
- `BridgeEmailToken` — Connected email account (id, email, is_primary, provider, full_domain, is_personal_email)
- `UserWithConnectedAccounts` — Full user with connectedAccounts, networkDomains, connectedDomains arrays
- `ConnectedAccount` — Normalized connected email (email, domain, isPrimary, isPersonalEmail, provider)
- `AuthResult` / `AuthResultWithAccounts` — Auth resolver return types

### Access Types (`access.ts`)
- `AccessStatus` — Cookie payload (granted, reason, matchedDomain, matchedVcDomain, checkedAt, providerId, animationShown)
- `AccessReason` — `admin` | `vc_team` | `portfolio_match` | `manual_grant` | `denied`
- `AccessRequest` — Manual request model

### Changelog Types (`changelog.ts`)
- `ChangelogAction` — Union of admin action types (`access_request.approve`, `access_request.reject`, `whitelist.upload_csv`, `offers.sync`, `vendors.sync`, `provider.create`, `provider.update`, `provider.delete`)
- `ChangelogEntityType` — `access_request` | `whitelist` | `offers` | `vendors` | `provider`
- `ChangelogEntry` — Full audit log entry (matches `admin_changelog` table schema)
- `ChangelogLogParams` — Parameters for `changelogService.log()` (adminId, adminEmail, action, entityType, summary, details)
- `ChangelogFilters` — Query filters for `changelogService.list()`
- `ChangelogListResponse` — Paginated response with entries + pagination metadata

---

## CSV Upload (Whitelist)

The whitelist page (`/admin/whitelist`) includes a full-featured CSV upload flow:

### Upload Modal Flow
1. **Select file** — drag-drop zone or file browser (CSV only, max 5MB)
2. **Client-side validation** — parses CSV, validates domain format, email format, detects booleans in email columns
3. **Preview** — shows validation result (green success with domain/email counts, or red error list with per-row issues)
4. **Confirmation** — "Bulk Whitelisting Confirmation" screen showing domain count, email count, file name
5. **Upload** — sends to `/api/admin/whitelist/upload` which proxies to GetProven `/whitelist/domains/upload/`

### CSV Format (GetProven)
```
domain,offer_categories,email1,email2,...
a16z.com,SaaS Tools,partner@a16z.com,analyst@a16z.com
sequoiacap.com,,team@sequoiacap.com,
```
- Column 1: domain (required)
- Column 2: offer_categories (optional, comma-separated inside quotes)
- Column 3+: email addresses (optional, one per column — NOT comma-separated in one column)

### Validation Rules
- Domain must match `DOMAIN_REGEX` (valid domain format)
- Emails must match `EMAIL_REGEX` (basic email format)
- Boolean values (`TRUE`, `FALSE`, `yes`, `no`, `1`, `0`) in email columns are rejected with specific error
- Max 1,000 rows per file
- Header row auto-detected (if first row contains "domain")

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

### Bridge Design System Tokens (used in admin UI)
| Token | Hex | Usage |
|-------|-----|-------|
| Royal Blue | `#0038FF` | Primary buttons, links, focus rings |
| Royal Hover | `#0036D7` | Button hover state |
| Charcoal | `#0D1531` | Primary text, headings |
| Slate | `#676C7E` | Secondary text |
| Mist | `#81879C` | Tertiary text, placeholders |
| Cloud | `#F2F3F5` | Hover backgrounds |
| Fog | `#F9F9FA` | Section backgrounds |
| Border | `#ECEDF0` | Subtle borders |
| Kelly Green | `#0EA02E` | Success states |
| Ruby Red | `#E13535` | Error states, destructive |

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
| `app-shell.tsx` | Main layout wrapper (top nav + content + footer) |
| `top-nav.tsx` | Navigation bar with logo, links, user menu, access badge |
| `user-menu.tsx` | User dropdown (avatar, access status badge, connected accounts, admin link, Bridge link) |
| `access-badge.tsx` | Compact access status pill in top nav (color-coded by reason, admin badge links to /admin) |
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
| `admin-sidebar.tsx` | Admin sidebar with collapsible Access Control group, count badges, and Audit Logs link |
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
ADMIN_EMAIL_ALLOWLIST=           # Comma-separated admin emails (e.g., connor@brdg.app)
ADMIN_DOMAIN_ALLOWLIST=          # Comma-separated admin domains (leave empty to restrict)

# Supabase (required for access requests + analytics + audit logs)
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=       # Service role key (server-only, bypasses RLS)

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
| Provider Owner Access | `owner_email` field on `providers` table + `isProviderOwner()` in auth.ts. Non-admin users whose email matches the provider's owner can access the whitelist page. Whitelist API returns `isOwner` flag. |
| CSV Upload Modal | Full drag-drop upload modal with client-side CSV validation, format help, template download, confirmation step matching GetProven's "Bulk Whitelisting Confirmation" UX |
| CSV Format Fix | Corrected CSV template: emails go in separate columns (3+), not comma-separated in one column. Validation rejects booleans (`TRUE`/`FALSE`) in email columns. |
| Admin Access Restriction | `ADMIN_EMAIL_ALLOWLIST=connor@brdg.app`, `ADMIN_DOMAIN_ALLOWLIST=` (empty). Only connor@brdg.app has admin access. |
| Admin Audit Logs | `admin_changelog` table + `/admin/changelog` page with filterable audit log (entity type tabs, date range, pagination). All admin actions logged via `changelogService.log()` |
| Supabase RLS Preparation | All API routes use `createSupabaseAdmin()` with `SUPABASE_SERVICE_ROLE_KEY` (service role) to bypass RLS policies |
| Royal Blue Design Fix | Replaced all indigo colors with Royal Blue (#0038FF) per Bridge Design System |
| Access Badge in Top Nav | `<AccessBadge />` component shows color-coded access status pill with admin link |
| Access Cookie Route Handler | `POST /api/access/resolve` persists access cookie via Route Handler |
| Animation-Controlled Access Gate | 8s scanning animation with VC favicon conveyor + 2.5s granted screen; cookie-controlled |
| Multi-Provider Support | Support multiple GetProven instances via `providers` table |
| Redemption Analytics | Charts, tables, date range filters, CSV export |
| Bridge API Integration | Intropath counts, portfolio domain matching |
| MercuryOS Design System | Consistent visual language across all components |

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
- **Logging:** Via `logger.ts` (server-only, dev console in development, errors-only in production)
- **Class merging:** Use `cn()` utility (clsx-based)
- **Data normalization:** Raw API responses normalized via `normalizers/getproven.ts`
- **Cookie names:** `authToken` (Bridge), `bridge_api_key` (API key), `perks_access` (access cache)
- **Auth functions:** `resolveAuth()` for basic auth, `resolveAuthWithAccounts()` for full connected accounts, `requireAdmin()` for admin-only routes, `isProviderOwner()` for provider-level access
