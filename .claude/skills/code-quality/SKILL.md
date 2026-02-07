---
name: code-quality
description: >
  Code quality and engineering standards for Bridge's Perks Portal v2. Enforces
  TypeScript strictness, naming conventions, file structure, error handling, testing
  patterns, performance, and clean code principles. This skill should be read on EVERY
  coding task — it defines how code is written, not what is built. Trigger on: any code
  generation, implementation, refactoring, bug fix, feature development, "write code",
  "implement", "build", "create component", "add feature", "fix bug", "refactor".
---

# Code Quality Standards — Bridge Perks Portal v2

These standards apply to ALL code written for Bridge products. Every function, component, and module must meet these rules. This skill defines *how* code is written — other skills define *what* to build.

**Stack:** Next.js 14+ (App Router), TypeScript, React, Tailwind CSS, Supabase, Lucide React

---

## 1. TypeScript Strictness

### Strict Mode (Non-Negotiable)

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Rules

**Never use `any`.** Use `unknown` and narrow with type guards.

```typescript
// ❌ any
function processData(data: any) { return data.name }

// ✅ unknown + narrowing
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    return String((data as { name: unknown }).name)
  }
  throw new Error('Invalid data shape')
}
```

**Always type function signatures — params AND return type.**

```typescript
// ❌ Implicit return type
function getOffers(providerId: string) {
  return supabase.from('offer_tracker').select('*').eq('provider_id', providerId)
}

// ✅ Explicit return type
async function getOffers(providerId: string): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offer_tracker')
    .select('*')
    .eq('provider_id', providerId)
    .returns<Offer[]>()

  if (error) throw new AppError('FETCH_FAILED', error.message)
  return data ?? []
}
```

**Define types for all data shapes.**

```typescript
// ✅ Explicit types for database rows
type Offer = {
  id: string
  offer_id: string
  title: string
  vendor_name: string
  category: string
  status: 'active' | 'expired' | 'removed'
  provider_id: string
  first_seen: string
  last_synced: string
}

// ✅ Props types for components
type OfferCardProps = {
  offer: Offer
  onRedeem?: (offerId: string) => void
}
```

**Use discriminated unions for state, not booleans.**

```typescript
// ❌ Boolean soup
type State = {
  isLoading: boolean
  isError: boolean
  data: Offer[] | null
  error: string | null
}

// ✅ Discriminated union
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Offer[] }
  | { status: 'error'; error: string }
```

**Use `satisfies` for type-safe object literals.**

```typescript
// ✅ Catches typos and missing keys while preserving literal types
const ROUTES = {
  home: '/',
  perks: '/perks',
  admin: '/admin',
  adminProviders: '/admin/providers',
} satisfies Record<string, string>
```

**Use `as const` for constant objects and arrays.**

```typescript
// ✅ Literal types, not widened strings
const OFFER_STATUSES = ['active', 'expired', 'removed'] as const
type OfferStatus = (typeof OFFER_STATUSES)[number] // 'active' | 'expired' | 'removed'
```

---

## 2. Naming Conventions

### Files & Directories

| Type | Convention | Example |
|------|-----------|---------|
| Directories | kebab-case | `offer-tracker/`, `admin-dashboard/` |
| React components | PascalCase | `OfferCard.tsx`, `AdminNav.tsx` |
| Utilities / helpers | camelCase | `formatCurrency.ts`, `getSession.ts` |
| Constants | camelCase file, UPPER_SNAKE value | `constants.ts` → `MAX_RETRIES` |
| Types | PascalCase file & type | `types.ts` → `type Offer = {...}` |
| API routes | `route.ts` (Next.js convention) | `app/api/offers/route.ts` |
| Hooks | camelCase with `use` prefix | `useOffers.ts`, `useAuth.ts` |

### Variables & Functions

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `offerCount`, `isLoading` |
| Boolean variables | `is`, `has`, `should`, `can` prefix | `isActive`, `hasError`, `canRedeem` |
| Functions | camelCase, verb-first | `fetchOffers()`, `handleRedeem()` |
| Event handlers | `handle` prefix | `handleClick`, `handleSubmit` |
| Callback props | `on` prefix | `onClick`, `onRedeem`, `onFilterChange` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_TIMEOUT` |
| Types / Interfaces | PascalCase | `Offer`, `OfferCardProps` |
| Enums | PascalCase (prefer union types instead) | Prefer `type Status = 'active' \| 'expired'` |
| Generic types | Single uppercase letter or descriptive | `T`, `TData`, `TError` |

### React Components

```typescript
// ✅ Component naming
export function OfferCard({ offer, onRedeem }: OfferCardProps) { ... }

// ✅ Not default exports for components (makes refactoring easier)
// Exception: page.tsx and layout.tsx (Next.js requires default export)

// ❌ Avoid
export default function Card(props: any) { ... }
```

---

## 3. File Structure

### Project Layout

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Route groups
│   ├── admin/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # Primitive UI components (Button, Input, Badge)
│   ├── offers/             # Feature-specific components
│   ├── admin/
│   └── layout/             # Nav, Footer, Sidebar
├── lib/
│   ├── supabase/           # Supabase client setup & queries
│   ├── utils.ts            # Generic utility functions
│   └── constants.ts        # App-wide constants
├── hooks/                  # Custom React hooks
├── types/                  # Shared TypeScript types
└── styles/                 # Global styles if needed
```

### Rules

- **One component per file** — no multi-component files
- **Co-locate related files** — tests, styles, and types near their component
- **Feature folders over type folders** — group by feature (`offers/`, `admin/`), not by file type (`components/`, `hooks/`)
- **Barrel exports only at feature boundaries** — avoid deep `index.ts` chains
- **No circular imports** — if A imports B and B imports A, extract shared code to C

### Import Order

```typescript
// 1. React / Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { Search, X } from 'lucide-react'

// 3. Internal modules (absolute paths with @/)
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

// 4. Relative imports (components, types)
import { OfferCard } from './OfferCard'
import type { Offer } from './types'

// 5. Styles (if any)
import './styles.css'
```

---

## 4. Error Handling

### The Error Pattern

Every function that can fail must handle errors explicitly. No swallowed errors. No bare catches.

```typescript
// ✅ Custom error class
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// ✅ Usage
async function getOffers(providerId: string): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offer_tracker')
    .select('*')
    .eq('provider_id', providerId)
    .returns<Offer[]>()

  if (error) {
    console.error('[getOffers]', error.message)
    throw new AppError('OFFERS_FETCH_FAILED', 'Failed to load offers', 500)
  }

  return data ?? []
}
```

### Error Handling Rules

| Rule | Why |
|------|-----|
| Never `catch {}` or `catch (e) {}` with no body | Hides bugs silently |
| Always log errors with context | `console.error('[functionName]', error)` |
| User-facing errors must be friendly | "Failed to load offers" not `PGRST301` |
| API routes must return proper status codes | 400, 401, 403, 404, 500 |
| Always check Supabase `error` before using `data` | `data` can be null on error |
| Use try/catch at boundaries, not around every line | API routes, event handlers, effects |

### API Route Error Pattern

```typescript
export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const offers = await getOffers(session.user.id)
    return Response.json({ data: offers })
  } catch (error) {
    console.error('[GET /api/offers]', error)
    const message = error instanceof AppError ? error.message : 'Internal server error'
    const status = error instanceof AppError ? error.statusCode : 500
    return Response.json({ error: message }, { status })
  }
}
```

---

## 5. React Patterns

### Server vs Client Components

**Default to Server Components.** Only add `'use client'` when you need:
- `useState`, `useEffect`, `useRef`, or other hooks
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `document`, `localStorage`)
- Third-party client libraries

```typescript
// ✅ Server Component (default) — no 'use client'
export default async function PerksPage() {
  const offers = await getOffers()
  return <OfferGrid offers={offers} />
}

// ✅ Client Component — only when interactive
'use client'
export function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('')
  // ...
}
```

### Component Structure

```typescript
// 1. 'use client' directive (if needed)
'use client'

// 2. Imports
import { useState } from 'react'
import type { Offer } from '@/types'

// 3. Type definitions
type OfferCardProps = {
  offer: Offer
  onRedeem?: (offerId: string) => void
}

// 4. Component
export function OfferCard({ offer, onRedeem }: OfferCardProps) {
  // State
  const [isExpanded, setIsExpanded] = useState(false)

  // Derived values
  const displayValue = formatCurrency(offer.estimated_value)

  // Handlers
  function handleRedeem() {
    onRedeem?.(offer.offer_id)
  }

  // Render
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      {/* ... */}
    </div>
  )
}
```

### Rules

| Rule | Rationale |
|------|-----------|
| No inline function definitions in JSX | Creates new reference every render |
| Extract complex logic to custom hooks | Keeps components readable |
| Use `function` declarations for components, not `const` arrows | Better stack traces, hoisting |
| Memoize expensive computations with `useMemo` | Prevent unnecessary recalculation |
| Memoize callbacks passed to children with `useCallback` | Prevent unnecessary re-renders |
| Always provide stable `key` props on lists | Never use array index as key if list can reorder |
| Handle all states: loading, error, empty, success | No component should only handle the happy path |

### Loading / Error / Empty Pattern

```typescript
export function OfferList({ offers, isLoading, error }: OfferListProps) {
  if (isLoading) {
    return <OfferListSkeleton />
  }

  if (error) {
    return <ErrorState message="Failed to load offers" onRetry={refetch} />
  }

  if (offers.length === 0) {
    return <EmptyState title="No perks found" action={{ label: 'Clear filters', onClick: clearFilters }} />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  )
}
```

---

## 6. Tailwind CSS Rules

### Do

- Use design system tokens from `bridge-design-system` skill
- Use utility classes directly in JSX
- Use `cn()` helper for conditional classes (clsx + tailwind-merge)
- Use responsive prefixes: `sm:`, `md:`, `lg:`
- Use `gap-*` and `space-*` over margin

### Don't

- Don't use arbitrary values unless from design system (e.g., `text-[14px]` is fine, `text-[17px]` is not)
- Don't create CSS files for component styles — use Tailwind
- Don't use `@apply` except in global base styles
- Don't mix Tailwind with inline `style` props (unless dynamic values like percentages)

### Class Ordering Convention

```html
<!-- Layout → Spacing → Sizing → Typography → Colors → Borders → Effects → State -->
<div className="flex items-center gap-4 p-4 w-full text-[14px] text-charcoal bg-white border border-slate-30 rounded-xl shadow-ds1 hover:shadow-hover1 transition-shadow">
```

### The `cn()` Helper

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Usage
<button className={cn(
  'rounded-full px-6 py-3 font-semibold text-base',
  variant === 'primary' && 'bg-[#0038FF] text-white',
  variant === 'secondary' && 'border border-[#B3B7C4] text-[#0D1531]',
  disabled && 'opacity-30 pointer-events-none'
)}>
```

---

## 7. Input Validation

### Use Zod at Every Boundary

Validate data at the point it enters your system — API routes, form submissions, URL params.

```typescript
import { z } from 'zod'

// Define schema
const createProviderSchema = z.object({
  name: z.string().min(1, 'Provider name is required').max(100),
  api_url: z.string().url('Must be a valid URL'),
  api_key: z.string().min(10, 'API key too short'),
  is_default: z.boolean().default(false),
})

// Validate in API route
export async function POST(request: Request): Promise<Response> {
  const body = await request.json()
  const result = createProviderSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  // result.data is now fully typed and validated
  const provider = await createProvider(result.data)
  return Response.json({ data: provider }, { status: 201 })
}
```

### Validate Environment Variables at Startup

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  BRIDGEBOX_API_URL: z.string().url(),
  BRIDGEBOX_API_KEY: z.string().min(1),
})

export const env = envSchema.parse(process.env)
```

---

## 8. Performance Patterns

### Data Fetching

| Pattern | When to Use |
|---------|-------------|
| Server Components with `await` | Default for page loads |
| `loading.tsx` / Suspense | Streaming / progressive rendering |
| SWR or React Query | Client-side data that needs revalidation |
| API Route + fetch | When you need server-side processing |

### Avoid These

| Anti-Pattern | Fix |
|-------------|-----|
| `useEffect` for data fetching | Use Server Components or SWR |
| Fetching in a loop | Batch into single query |
| `select('*')` without `.limit()` | Always select only needed columns, always limit |
| Re-fetching unchanged data | Use caching (SWR, `revalidate`, or Supabase cache) |
| Large bundle imports | Import specific functions: `import { debounce } from 'lodash'` |
| Images without `next/image` | Always use `<Image>` for optimization |

### Debounce Search Inputs

```typescript
import { useDeferredValue } from 'react'

function SearchBar() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  // Use deferredQuery for the actual search
  // UI stays responsive because React deprioritizes the search
}
```

---

## 9. Security Checklist

Apply on every feature:

- [ ] **Auth check** on every protected route and API endpoint
- [ ] **Input validation** with Zod on all user input
- [ ] **No secrets in client code** — only `NEXT_PUBLIC_*` vars in browser
- [ ] **Supabase service role** only in server-side code
- [ ] **RLS enabled** on every table
- [ ] **No `dangerouslySetInnerHTML`** without DOMPurify sanitization
- [ ] **No user input in redirects** without validation
- [ ] **Rate limiting** on public API routes
- [ ] **CSRF protection** on state-changing requests

---

## 10. Code Cleanliness

### Functions

- **Max ~30 lines per function** — if longer, extract helpers
- **Single responsibility** — a function does one thing
- **Early returns** over nested if/else

```typescript
// ❌ Deep nesting
async function handleRedeem(offerId: string) {
  if (offerId) {
    const session = await getSession()
    if (session) {
      const offer = await getOffer(offerId)
      if (offer) {
        if (offer.status === 'active') {
          // finally do the thing
        }
      }
    }
  }
}

// ✅ Early returns (guard clauses)
async function handleRedeem(offerId: string) {
  if (!offerId) return
  
  const session = await getSession()
  if (!session) throw new AppError('UNAUTHORIZED', 'Must be logged in')

  const offer = await getOffer(offerId)
  if (!offer) throw new AppError('NOT_FOUND', 'Offer not found')
  if (offer.status !== 'active') throw new AppError('INACTIVE', 'Offer is no longer active')

  // do the thing
}
```

### Comments

- **Don't comment what** — the code should be readable enough
- **Comment why** — explain non-obvious decisions, workarounds, business logic

```typescript
// ❌ Useless comment
// Get the offers
const offers = await getOffers()

// ✅ Explains WHY
// Snapshot offer name at click time so historical data survives if offer is renamed
const clickRecord = {
  offer_name: offer.title,
  vendor_name: offer.vendor_name,
  // ...
}
```

### Magic Numbers / Strings

```typescript
// ❌ Magic numbers
if (offers.length > 7) { ... }
setTimeout(fn, 86400000)

// ✅ Named constants
const RECENTLY_ADDED_DAYS = 7
const ONE_DAY_MS = 24 * 60 * 60 * 1000

if (offers.length > RECENTLY_ADDED_DAYS) { ... }
setTimeout(fn, ONE_DAY_MS)
```

### Dead Code

- **Delete it, don't comment it out.** Git has history.
- No unused imports, variables, or functions
- No TODO comments older than the current sprint — resolve or create a ticket

---

## 11. Git Conventions

### Commit Messages

Format: `type: short description`

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that doesn't fix a bug or add a feature |
| `style` | Formatting, missing semicolons, etc. |
| `chore` | Build process, dependencies, tooling |
| `docs` | Documentation |

```
feat: add multi-provider support to admin dashboard
fix: resolve mixed provider data in redemption analytics
refactor: extract offer sync logic into dedicated service
```

### Branch Naming

```
feat/multi-provider-support
fix/redemption-tracking-mixed-data
refactor/admin-page-consolidation
```

---

## Quick Reference: Code Smells to Flag

| Smell | Fix |
|-------|-----|
| `any` type | Type it properly or use `unknown` |
| Empty catch block | Log the error, handle it, or rethrow |
| `useEffect` for data fetching | Server Component or SWR |
| Boolean props (`isX && isY && !isZ`) | Discriminated union |
| Component over 200 lines | Extract sub-components |
| More than 3 levels of prop drilling | Context, composition, or state library |
| `// TODO` without action | Do it now or create a ticket |
| Commented-out code | Delete it. Git remembers. |
| `console.log` left in code | Remove or convert to proper logging |
| Hardcoded colors/spacing | Use design system tokens |
