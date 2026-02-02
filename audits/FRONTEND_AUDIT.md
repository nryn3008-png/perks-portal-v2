# Perks Portal – Frontend Audit Guide

**Purpose:** This document provides a comprehensive frontend code audit framework for Claude Code to evaluate and improve the code quality, component architecture, accessibility, and performance of the Perks Portal application.

---

## How to Use This Audit

1. **Run the automated checks** in each section
2. **Inspect flagged files** manually
3. **Fix issues** following the patterns provided
4. **Verify fixes** with the testing commands
5. **Commit improvements** with descriptive messages

---

## 1. Code Quality Standards

### 1.1 TypeScript Compliance

**Checks:**
- [ ] No `any` types
- [ ] Explicit prop interfaces for all components
- [ ] Proper type exports/imports
- [ ] No type assertions (`as`) without justification

**Audit Commands:**
```bash
# Run TypeScript check
npm run type-check

# Find any types
grep -r ": any" src/ --include="*.tsx" --include="*.ts"
grep -r "as any" src/ --include="*.tsx" --include="*.ts"

# Find missing type annotations
grep -rE "const .+ = \(" src/components/ --include="*.tsx" | grep -v ": " | head -20
```

**Expected Patterns:**
```tsx
// ✅ Correct - explicit interface
interface PerkCardProps {
  perk: Perk
  onRedeem?: () => void
}

export function PerkCard({ perk, onRedeem }: PerkCardProps) {
  // ...
}

// ❌ Wrong - implicit any
export function PerkCard({ perk, onRedeem }) {
  // ...
}

// ❌ Wrong - any assertion
const data = response as any
```

**Files to Check:**
```
src/components/**/*.tsx
src/lib/**/*.ts
src/types/**/*.ts
```

---

### 1.2 Semantic HTML

**Checks:**
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Semantic elements used (`<nav>`, `<main>`, `<section>`, `<article>`)
- [ ] `<button>` for actions, `<a>` for navigation
- [ ] Lists use `<ul>/<ol>` not divs

**Audit Commands:**
```bash
# Check for div-only structures
grep -c "<div" src/components/ --include="*.tsx" | awk -F: '{sum+=$2} END {print "Total divs:", sum}'

# Check for semantic elements
grep -rE "<nav|<main|<section|<article|<aside|<header|<footer" src/ --include="*.tsx"

# Find non-button clickable divs (bad pattern)
grep -rE "onClick.*<div|<div.*onClick" src/components/ --include="*.tsx"

# Check heading structure
grep -rE "<h[1-6]" src/ --include="*.tsx"
```

**Expected Patterns:**
```tsx
// ✅ Correct - semantic structure
<main>
  <section aria-labelledby="perks-heading">
    <h1 id="perks-heading">Perks Catalog</h1>
    <nav aria-label="Filters">
      {/* filter buttons */}
    </nav>
    <ul role="list">
      {perks.map(perk => (
        <li key={perk.id}>
          <article>
            {/* perk card content */}
          </article>
        </li>
      ))}
    </ul>
  </section>
</main>

// ❌ Wrong - div soup
<div>
  <div>
    <div onClick={handleClick}>Click me</div>
  </div>
</div>
```

---

### 1.3 Component Architecture

**Checks:**
- [ ] Components are focused (single responsibility)
- [ ] No prop drilling (use context if needed)
- [ ] Reusable components in `ui/` folder
- [ ] Feature components in feature folders

**Audit Commands:**
```bash
# Check component file sizes (>300 lines = consider splitting)
find src/components -name "*.tsx" -exec wc -l {} \; | sort -rn | head -10

# Check for deeply nested props
grep -rE "props\.\w+\.\w+\.\w+" src/components/ --include="*.tsx"

# Check component organization
ls -la src/components/ui/
ls -la src/components/perks/
ls -la src/components/layout/
```

**Expected Structure:**
```
src/components/
├── ui/                    # Reusable primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── badge.tsx
├── perks/                 # Feature-specific
│   ├── perk-card.tsx
│   ├── perks-grid.tsx
│   └── category-filter.tsx
└── layout/                # Layout components
    ├── top-nav.tsx
    └── app-shell.tsx
```

---

### 1.4 Code Style Consistency

**Checks:**
- [ ] No inline styles (use Tailwind)
- [ ] Consistent import ordering
- [ ] No commented-out code
- [ ] Meaningful variable names

**Audit Commands:**
```bash
# Find inline styles
grep -r "style={{" src/ --include="*.tsx"

# Find commented code blocks
grep -rE "^[[:space:]]*//.*[a-zA-Z]+\(" src/ --include="*.tsx" | head -20

# Find TODO comments (track them)
grep -r "TODO:" src/ --include="*.tsx" --include="*.ts"

# Check for magic numbers (should be constants)
grep -rE "\b(100|200|300|400|500|1000|2000)\b" src/components/ --include="*.tsx" | grep -v "duration-\|delay-\|w-\|h-\|text-"
```

**Expected Patterns:**
```tsx
// ✅ Correct - Tailwind classes
<button className="bg-blue-500 hover:bg-blue-600 px-4 py-2">

// ❌ Wrong - inline styles
<button style={{ backgroundColor: 'blue', padding: '8px 16px' }}>

// ✅ Correct - named constant
const DEBOUNCE_MS = 300
useDebounce(search, DEBOUNCE_MS)

// ❌ Wrong - magic number
useDebounce(search, 300)
```

---

## 2. Accessibility Audit

### 2.1 Keyboard Navigation

**Checks:**
- [ ] All interactive elements focusable
- [ ] Visible focus indicators
- [ ] Logical tab order
- [ ] Escape closes modals/dropdowns

**Audit Commands:**
```bash
# Check for focus styles
grep -r "focus:" src/components/ --include="*.tsx"
grep -r "focus-visible:" src/components/ --include="*.tsx"

# Check for tabIndex usage
grep -r "tabIndex" src/ --include="*.tsx"

# Check for keyboard handlers
grep -r "onKeyDown" src/ --include="*.tsx"
```

**Expected Patterns:**
```tsx
// ✅ Button with focus style
<button className="
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-[#0038FF]
  focus-visible:ring-offset-2
">

// ✅ Modal with escape handler
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }
  window.addEventListener('keydown', handleEscape)
  return () => window.removeEventListener('keydown', handleEscape)
}, [onClose])

// ✅ Skip link for keyboard users
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

---

### 2.2 ARIA Attributes

**Checks:**
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have accessible names
- [ ] Live regions for dynamic content
- [ ] Proper ARIA roles

**Audit Commands:**
```bash
# Check for missing alt text
grep -rE "<img|<Image" src/ --include="*.tsx" | grep -v "alt="

# Check for aria-label usage
grep -r "aria-label" src/ --include="*.tsx"

# Check for aria-labelledby
grep -r "aria-labelledby" src/ --include="*.tsx"

# Check form labels
grep -r "htmlFor" src/ --include="*.tsx"
```

**Expected Patterns:**
```tsx
// ✅ Image with alt text
<Image src={logo} alt="Vendor name logo" width={48} height={48} />

// ✅ Decorative image
<Image src={pattern} alt="" aria-hidden="true" />

// ✅ Button with accessible name
<button aria-label="Close menu">
  <X className="w-5 h-5" />
</button>

// ✅ Form input with label
<label htmlFor="search-input">Search perks</label>
<input id="search-input" type="search" />

// ✅ Or visually hidden label
<label htmlFor="search-input" className="sr-only">Search perks</label>
<input id="search-input" type="search" placeholder="Search..." />
```

---

### 2.3 Color Contrast

**Checks:**
- [ ] Text contrast ratio ≥4.5:1 (normal text)
- [ ] Text contrast ratio ≥3:1 (large text, 18px+)
- [ ] Interactive elements contrast ≥3:1

**Manual Check Areas:**
```
src/components/ui/badge.tsx      # Badge text colors
src/components/ui/button.tsx     # Button text on backgrounds
src/components/perks/perk-card.tsx  # Card text colors
```

**Common Issues:**
```tsx
// ❌ Likely poor contrast
<span className="text-gray-400">Low contrast text</span>

// ✅ Better contrast
<span className="text-gray-600">Better contrast text</span>

// For small text (badges), ensure sufficient contrast
<span className="bg-emerald-50 text-emerald-700">New</span>  // ✅ Good
<span className="bg-emerald-50 text-emerald-400">New</span>  // ❌ Too light
```

---

### 2.4 Screen Reader Support

**Checks:**
- [ ] Meaningful page titles
- [ ] Heading hierarchy is logical
- [ ] Dynamic content announced
- [ ] Form errors associated with inputs

**Audit Commands:**
```bash
# Check for sr-only usage
grep -r "sr-only" src/ --include="*.tsx"

# Check for aria-live
grep -r "aria-live" src/ --include="*.tsx"

# Check for role attributes
grep -r "role=" src/ --include="*.tsx"
```

**Expected Patterns:**
```tsx
// ✅ Screen reader only text
<span className="sr-only">Open menu</span>

// ✅ Live region for updates
<div aria-live="polite" aria-atomic="true">
  {message && <p>{message}</p>}
</div>

// ✅ Error message association
<input
  id="email"
  aria-describedby="email-error"
  aria-invalid={!!error}
/>
{error && <p id="email-error" className="text-error-600">{error}</p>}
```

---

## 3. State Management Audit

### 3.1 Component State

**Checks:**
- [ ] State lives at appropriate level
- [ ] No redundant state
- [ ] Derived values computed, not stored
- [ ] Loading/error states handled

**Audit Commands:**
```bash
# Find useState usage
grep -r "useState" src/ --include="*.tsx" | wc -l

# Find useEffect usage (check for unnecessary effects)
grep -r "useEffect" src/ --include="*.tsx"

# Check for state that could be derived
grep -rE "const \[.*,.*\] = useState\(" src/components/ --include="*.tsx" | head -20
```

**Expected Patterns:**
```tsx
// ✅ Correct - derived value computed
const filteredPerks = useMemo(() =>
  perks.filter(p => p.category === selectedCategory),
  [perks, selectedCategory]
)

// ❌ Wrong - redundant state
const [perks, setPerks] = useState([])
const [filteredPerks, setFilteredPerks] = useState([])

useEffect(() => {
  setFilteredPerks(perks.filter(p => p.category === selectedCategory))
}, [perks, selectedCategory])
```

---

### 3.2 URL State (Filters/Search)

**Checks:**
- [ ] Filter state in URL params
- [ ] Shareable/bookmarkable URLs
- [ ] Back button works correctly

**Audit Commands:**
```bash
# Check for useSearchParams
grep -r "useSearchParams" src/ --include="*.tsx"

# Check for URL manipulation
grep -r "router.push\|router.replace" src/ --include="*.tsx"
```

**Expected Patterns:**
```tsx
// ✅ Filter state in URL
const searchParams = useSearchParams()
const category = searchParams.get('category')

const updateFilters = (newCategory: string) => {
  const params = new URLSearchParams(searchParams)
  params.set('category', newCategory)
  router.push(`?${params.toString()}`)
}
```

---

## 4. Performance Audit

### 4.1 Image Optimization

**Checks:**
- [ ] Next.js `<Image>` component used
- [ ] Images have width/height specified
- [ ] Lazy loading for below-fold images
- [ ] Appropriate formats (WebP/AVIF)

**Audit Commands:**
```bash
# Check for <img> tags (should use Next.js Image)
grep -r "<img" src/ --include="*.tsx"

# Check Image component usage
grep -r "from 'next/image'" src/ --include="*.tsx"

# Check for missing dimensions
grep -rE "<Image" src/ --include="*.tsx" | grep -v "width=\|height="
```

**Expected Patterns:**
```tsx
// ✅ Correct - Next.js Image with dimensions
import Image from 'next/image'

<Image
  src={vendor.logo}
  alt={`${vendor.name} logo`}
  width={48}
  height={48}
  className="rounded-lg"
/>

// ❌ Wrong - raw img tag
<img src={vendor.logo} />
```

---

### 4.2 Component Memoization

**Checks:**
- [ ] Expensive computations use `useMemo`
- [ ] Callbacks use `useCallback` when passed to children
- [ ] List items use `React.memo` if appropriate

**Audit Commands:**
```bash
# Check for useMemo usage
grep -r "useMemo" src/ --include="*.tsx"

# Check for useCallback usage
grep -r "useCallback" src/ --include="*.tsx"

# Find expensive map operations that might need memoization
grep -rE "\.map\(.*=>.*\(" src/components/ --include="*.tsx" | head -10
```

**Expected Patterns:**
```tsx
// ✅ Memoized expensive filter
const filteredPerks = useMemo(() => {
  return perks
    .filter(p => p.category === category)
    .sort((a, b) => a.name.localeCompare(b.name))
}, [perks, category])

// ✅ Stable callback reference
const handleClick = useCallback((id: string) => {
  router.push(`/perks/${id}`)
}, [router])
```

---

### 4.3 Bundle Size

**Checks:**
- [ ] No unused dependencies
- [ ] Icons imported individually
- [ ] Dynamic imports for large components

**Audit Commands:**
```bash
# Check Lucide imports (should be individual)
grep -r "from 'lucide-react'" src/ --include="*.tsx"

# Look for * imports (bad for tree-shaking)
grep -r "import \*" src/ --include="*.tsx"

# Check bundle analysis (run build first)
npm run build 2>&1 | grep -E "Route|Size"
```

**Expected Patterns:**
```tsx
// ✅ Correct - individual icon imports
import { Search, Menu, X } from 'lucide-react'

// ❌ Wrong - imports entire library
import * as Icons from 'lucide-react'

// ✅ Dynamic import for heavy component
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
})
```

---

### 4.4 Data Fetching

**Checks:**
- [ ] Server components used where possible
- [ ] Client fetching uses SWR/React Query patterns
- [ ] Proper error boundaries
- [ ] Loading states implemented

**Audit Commands:**
```bash
# Check for 'use client' directives
grep -r "'use client'" src/ --include="*.tsx"

# Check for fetch in components
grep -r "fetch(" src/components/ --include="*.tsx"

# Check for suspense boundaries
grep -r "Suspense" src/ --include="*.tsx"
```

**Expected Patterns:**
```tsx
// ✅ Server component (no 'use client')
// src/app/(dashboard)/perks/page.tsx
export default async function PerksPage() {
  const perks = await getPerks()
  return <PerksGrid perks={perks} />
}

// ✅ Client component with proper data fetching
'use client'

export function PerksFilter() {
  const [filters, setFilters] = useState(null)

  useEffect(() => {
    fetch('/api/perks/filters')
      .then(res => res.json())
      .then(setFilters)
  }, [])

  if (!filters) return <FilterSkeleton />
  return <FilterUI filters={filters} />
}
```

---

## 5. Error Handling Audit

### 5.1 Error Boundaries

**Checks:**
- [ ] Error boundaries wrap major sections
- [ ] Fallback UI is helpful
- [ ] Errors are logged

**Audit Commands:**
```bash
# Check for error boundaries
grep -r "ErrorBoundary" src/ --include="*.tsx"

# Check for error.tsx files (Next.js error handling)
find src/app -name "error.tsx"

# Check for try-catch in async functions
grep -rE "try\s*\{" src/ --include="*.tsx"
```

**Expected Structure:**
```
src/app/
├── error.tsx            # Global error boundary
├── (dashboard)/
│   ├── error.tsx        # Dashboard error boundary
│   └── perks/
│       └── error.tsx    # Perks section error boundary
```

---

### 5.2 Loading States

**Checks:**
- [ ] Every async operation has loading state
- [ ] Skeletons match actual content layout
- [ ] Loading files exist for route segments

**Audit Commands:**
```bash
# Check for loading.tsx files
find src/app -name "loading.tsx"

# Check for skeleton components
grep -r "Skeleton" src/ --include="*.tsx"

# Check for loading states in components
grep -rE "isLoading|loading" src/components/ --include="*.tsx"
```

**Expected Patterns:**
```tsx
// ✅ Loading file for route segment
// src/app/(dashboard)/perks/loading.tsx
export default function Loading() {
  return <PerksGridSkeleton />
}

// ✅ Component with loading state
function PerksList({ isLoading, perks }: Props) {
  if (isLoading) return <PerksGridSkeleton />
  if (perks.length === 0) return <EmptyState />
  return <PerksGrid perks={perks} />
}
```

---

## 6. Testing Readiness

### 6.1 Testable Structure

**Checks:**
- [ ] Components have clear inputs/outputs
- [ ] Business logic separated from UI
- [ ] Data fetching in separate functions
- [ ] Utils are pure functions

**Audit Commands:**
```bash
# Check lib folder structure
ls -la src/lib/

# Check for pure utility functions
grep -r "export function" src/lib/utils/ --include="*.ts"

# Check for service layer
ls -la src/lib/api/
```

**Expected Structure:**
```
src/lib/
├── api/
│   ├── getproven-client.ts   # API client (testable)
│   └── perks-service.ts      # Service layer (testable)
├── utils/
│   ├── cn.ts                 # Pure utility
│   └── format.ts             # Pure utility
└── constants.ts              # Config values
```

---

### 6.2 Component Props

**Checks:**
- [ ] Components accept data as props (not fetch internally)
- [ ] Callbacks passed as props for actions
- [ ] Props are well-typed

**Expected Patterns:**
```tsx
// ✅ Testable - receives data as props
interface PerkCardProps {
  perk: Perk
  onRedeem: (perkId: string) => void
}

export function PerkCard({ perk, onRedeem }: PerkCardProps) {
  return (
    <article>
      <h3>{perk.name}</h3>
      <button onClick={() => onRedeem(perk.id)}>Redeem</button>
    </article>
  )
}

// ❌ Hard to test - fetches internally
export function PerkCard({ perkId }: { perkId: string }) {
  const [perk, setPerk] = useState(null)
  useEffect(() => {
    fetch(`/api/perks/${perkId}`).then(/* ... */)
  }, [perkId])
  // ...
}
```

---

## 7. Implementation Checklist

Run this checklist for each component:

### Visual Accuracy
- [ ] Colors match DESIGN_SYSTEM.md
- [ ] Typography matches design specs
- [ ] Spacing follows 8px grid
- [ ] Border radius is correct
- [ ] Icons are correct style/size

### States & Interactions
- [ ] Hover states implemented
- [ ] Focus states visible and accessible
- [ ] Active/pressed states
- [ ] Disabled states with proper treatment
- [ ] Loading states where applicable
- [ ] Error states for forms
- [ ] Empty states for lists

### Responsiveness
- [ ] Works at mobile (375px)
- [ ] Works at tablet (768px)
- [ ] Works at desktop (1280px+)
- [ ] No horizontal scroll
- [ ] Touch targets ≥44px on mobile

### Accessibility
- [ ] Semantic HTML elements
- [ ] Keyboard navigable
- [ ] Focus order follows visual order
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] ARIA attributes where needed

### Code Quality
- [ ] No inline styles
- [ ] No magic numbers
- [ ] Properly typed (TypeScript)
- [ ] Clean DOM structure

---

## 8. Audit Output Format

```markdown
### Finding: [Issue Title]

**Severity:** 🔴 Critical / 🟡 Major / 🔵 Minor

**Category:** TypeScript / Accessibility / Performance / Code Quality

**Location:** `src/path/to/file.tsx:line`

**Issue:** [Description]

**Fix:**
\`\`\`tsx
// Before
...

// After
...
\`\`\`

**Verification:**
\`\`\`bash
# Command to verify fix
...
\`\`\`
```

---

## 9. Automated Checks

Add these to CI/CD:

```json
// package.json scripts
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "next lint",
    "lint:a11y": "eslint --ext .tsx src/ --rule 'jsx-a11y/...'",
    "audit:frontend": "npm run type-check && npm run lint"
  }
}
```

---

## 10. Post-Audit Actions

1. **Fix TypeScript errors** first (blocks other work)
2. **Fix accessibility issues** (critical for usability)
3. **Standardize component patterns** (improves maintainability)
4. **Optimize performance** (improves user experience)
5. **Add missing tests** (prevents regressions)

---

**This audit is based on the frontend-developer skill framework.**
**Run `npm run type-check && npm run lint` before committing.**
