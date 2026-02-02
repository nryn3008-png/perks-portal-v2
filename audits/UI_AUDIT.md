# Perks Portal – UI Audit Guide

**Purpose:** This document provides a comprehensive UI design audit framework for Claude Code to evaluate and improve the visual design, spacing, typography, and design system consistency of the Perks Portal application.

---

## How to Use This Audit

1. **Reference DESIGN_SYSTEM.md** as the authoritative source
2. **Inspect visual components** for consistency
3. **Verify spacing** follows 8px grid
4. **Check color usage** against brand tokens
5. **Fix violations** and update components

---

## 1. Design System Compliance

### 1.1 Color Token Audit

**Reference:** DESIGN_SYSTEM.md Section 2 (Brand Colors)

**Required Colors:**
| Token | Value | Usage |
|-------|-------|-------|
| Bridge Blue | `#0038FF` | Primary CTAs, active states |
| Bridge Blue 10% | `#0038FF/10` | Subtle backgrounds |
| Bridge Blue 20% | `#0038FF/20` | Hover states |
| Bridge Blue 40% | `#0038FF/40` | Focus borders |

**Audit Actions:**
```bash
# Check for hardcoded colors (should use tokens)
grep -rE "#[0-9a-fA-F]{3,6}" src/components/ --include="*.tsx" | grep -v "0038FF\|tailwind"

# Check for inconsistent blue usage
grep -r "blue-" src/components/ --include="*.tsx"

# Verify primary button color
grep -r 'bg-\[#0038FF\]\|bg-primary' src/components/ui/button.tsx
```

**Expected Patterns:**
```tsx
// ✅ Correct - uses design system color
<button className="bg-[#0038FF] hover:bg-[#0038FF]/90">

// ❌ Wrong - arbitrary blue
<button className="bg-blue-600 hover:bg-blue-700">
```

**Violations to Fix:**
- [ ] Replace arbitrary blues with Bridge Blue `#0038FF`
- [ ] Use opacity variants for hover/focus (10%, 20%, 40%)
- [ ] Ensure semantic colors (success, warning, error) from tailwind.config.js

---

### 1.2 Typography Audit

**Reference:** DESIGN_SYSTEM.md Section 3 (Typography)

**Font Requirements:**
- Font Family: Mulish (`--font-mulish`)
- Heading: `text-2xl` (page titles), `text-base` (section headings)
- Body: `text-[14px]` (primary), `text-[13px]` (secondary), `text-[12px]` (badges)

**Audit Actions:**
```bash
# Check font family usage
grep -r "font-" src/ --include="*.tsx" | grep -v "font-mulish\|font-sans"

# Check for non-standard text sizes
grep -rE "text-\[(?!14px|13px|12px)" src/components/ --include="*.tsx"

# Verify heading hierarchy
grep -rE "text-(2xl|xl|lg|base)" src/components/ --include="*.tsx"
```

**Typography Scale Validation:**
```tsx
// ✅ Page title
<h1 className="text-2xl font-semibold">Perks</h1>

// ✅ Section heading
<h2 className="text-base font-medium">Recently Added</h2>

// ✅ Body text
<p className="text-[14px] text-gray-600">Description</p>

// ✅ Meta/secondary
<span className="text-[13px] text-gray-500">4 perks</span>

// ✅ Badge text
<span className="text-[12px] font-medium">NEW</span>
```

**Violations to Fix:**
- [ ] Replace non-Mulish fonts with font-sans (configured to Mulish)
- [ ] Standardize heading sizes per DESIGN_SYSTEM.md
- [ ] Use specific pixel values for body text sizes

---

### 1.3 Spacing System Audit (8px Grid)

**Reference:** DESIGN_SYSTEM.md Section 4 (Spacing)

**Allowed Values:**
- 4px (micro-spacing ONLY for icon↔text, badge padding)
- 8px, 16px, 24px, 32px, 40px, 48px, 64px

**Disallowed Values:**
- 6px, 10px, 12px, 14px, 18px, or any non-8px multiple

**Audit Actions:**
```bash
# Find spacing violations (non-8px multiples except 4)
grep -rE "p-[1357]|m-[1357]|gap-[1357]|space-[xy]-[1357]" src/ --include="*.tsx"
grep -rE "p-[2.5]|m-[2.5]|gap-[2.5]" src/ --include="*.tsx"
grep -rE "\[6px\]|\[10px\]|\[12px\]|\[14px\]|\[18px\]" src/ --include="*.tsx"

# Check page padding (should be p-6 or px-6)
grep -r "className=.*p-[^4]" src/app/ --include="*.tsx"
```

**Spacing Reference:**
| Tailwind | Pixels | Usage |
|----------|--------|-------|
| `gap-1` / `p-1` | 4px | Icon↔text ONLY |
| `gap-2` / `p-2` | 8px | Tight spacing, filter bar |
| `gap-3` / `p-3` | 12px | ❌ AVOID |
| `gap-4` / `p-4` | 16px | Card padding, section gaps |
| `gap-5` / `p-5` | 20px | ❌ AVOID |
| `gap-6` / `p-6` | 24px | Page padding |
| `gap-8` / `space-y-8` | 32px | Section spacing |

**Common Fixes:**
```tsx
// ❌ Wrong - 12px (not on 8px grid)
<div className="p-3 gap-3">

// ✅ Correct - 16px
<div className="p-4 gap-4">

// ❌ Wrong - 20px
<div className="p-5">

// ✅ Correct - 24px
<div className="p-6">
```

**Violations to Fix:**
- [ ] Replace `p-3`, `gap-3`, `space-y-3` with `p-4`, `gap-4`, `space-y-4`
- [ ] Replace `p-5`, `gap-5` with `p-4` or `p-6`
- [ ] Ensure card grids use `gap-4` or `gap-6`
- [ ] Page padding should be `px-6` (desktop) or `px-4` (mobile)

---

### 1.4 Border Radius Audit

**Reference:** DESIGN_SYSTEM.md Section 5 (Border Radius)

**Required Patterns:**
| Element | Class |
|---------|-------|
| Buttons (CTA, filters, sort) | `rounded-full` |
| Search bar | `rounded-full` |
| Filter pills | `rounded-full` |
| Badges | `rounded-full` |
| Cards | `rounded-xl` |
| Dropdown menus | `rounded-xl` |

**Audit Actions:**
```bash
# Check button radius
grep -r "rounded-" src/components/ui/button.tsx

# Check card radius
grep -r "rounded-" src/components/ui/card.tsx
grep -r "rounded-" src/components/perks/perk-card.tsx

# Check for inconsistent radius
grep -rE "rounded-(sm|md|lg|2xl)" src/components/ --include="*.tsx"
```

**Violations to Fix:**
- [ ] Buttons should be `rounded-full` (pill shape)
- [ ] Cards should be `rounded-xl` (12px)
- [ ] Badges should be `rounded-full`
- [ ] Remove arbitrary `rounded-lg` or `rounded-md` from interactive elements

---

## 2. Component Visual Audit

### 2.1 Button System

**Reference:** DESIGN_SYSTEM.md Section 6 (Buttons)

**Files to Inspect:**
```
src/components/ui/button.tsx
```

**Checklist:**
- [ ] Primary variant: Bridge Blue background
- [ ] Secondary variant: subtle, not competing with primary
- [ ] Size `sm` is default everywhere
- [ ] Only ONE primary button per visual group
- [ ] Icon↔text spacing is 8px (`gap-2`)
- [ ] All buttons are `rounded-full`

**Audit Actions:**
```bash
# Count primary buttons per page
grep -r 'variant="primary"' src/app/ --include="*.tsx"

# Check button sizes
grep -r 'size="lg"' src/components/ --include="*.tsx"

# Verify button internal spacing
grep -r "gap-" src/components/ui/button.tsx
```

**Expected Button Anatomy:**
```tsx
// Primary CTA
<Button variant="primary" size="sm" className="rounded-full">
  <Icon className="w-4 h-4" />
  <span>Label</span>
</Button>

// Internal structure
<button className="
  inline-flex items-center justify-center gap-2
  px-4 py-2
  text-sm font-medium
  rounded-full
  transition-colors duration-150
">
```

---

### 2.2 Card Design

**Reference:** DESIGN_SYSTEM.md Section 8 (Cards)

**Files to Inspect:**
```
src/components/ui/card.tsx
src/components/perks/perk-card.tsx
src/components/perks/offer-card.tsx
```

**Checklist:**
- [ ] `rounded-xl` corners
- [ ] Subtle border (`border-gray-200`)
- [ ] Consistent padding (`p-4`)
- [ ] Hover lift effect with shadow
- [ ] No fixed heights (flex layout)
- [ ] Line clamping for long text

**Audit Actions:**
```bash
# Check card styling
grep -rE "rounded-|border-|shadow-|p-[0-9]" src/components/perks/*card*.tsx

# Check for fixed heights (anti-pattern)
grep -r "h-\[" src/components/perks/ --include="*.tsx"

# Check for line clamp
grep -r "line-clamp" src/components/ --include="*.tsx"
```

**Expected Card Structure:**
```tsx
<div className="
  rounded-xl
  border border-gray-200
  bg-white
  p-4
  transition-shadow duration-150
  hover:shadow-md
">
  {/* Content with flex layout, no fixed heights */}
</div>
```

---

### 2.3 Search Bar

**Reference:** DESIGN_SYSTEM.md Section 7 (Search Bar)

**Files to Inspect:**
```
src/components/ui/search-input.tsx
src/components/ui/input.tsx
```

**Checklist:**
- [ ] `rounded-full` shape
- [ ] Default: gray background, gray border
- [ ] Hover: white background, `border-[#0038FF]/40`
- [ ] Focus: white background, `border-[#0038FF]`, `ring-2 ring-[#0038FF]/20`

**Audit Actions:**
```bash
# Check search input styles
grep -rE "focus:|hover:" src/components/ui/search-input.tsx
grep -r "rounded-" src/components/ui/search-input.tsx
```

**Expected Search Styles:**
```tsx
<input className="
  w-full
  rounded-full
  border border-gray-300 bg-gray-50
  px-4 py-2
  text-sm
  transition-all duration-150
  hover:bg-white hover:border-[#0038FF]/40
  focus:bg-white focus:border-[#0038FF] focus:ring-2 focus:ring-[#0038FF]/20
  focus:outline-none
"/>
```

---

### 2.4 Filter Pills & Badges

**Reference:** DESIGN_SYSTEM.md Sections 6, 9

**Files to Inspect:**
```
src/components/ui/badge.tsx
src/components/perks/category-filter.tsx
```

**Checklist:**
- [ ] All pills/badges are `rounded-full`
- [ ] Active filter: white bg, shadow, dark text
- [ ] Inactive filter: transparent, gray text
- [ ] "New" badge: `bg-emerald-50 text-emerald-700`
- [ ] Badge text size: `text-[12px]`

**Audit Actions:**
```bash
# Check badge styling
grep -rE "emerald|green" src/components/ui/badge.tsx
grep -r "rounded-" src/components/ui/badge.tsx

# Check filter pill states
grep -rE "active|Active|selected|Selected" src/components/perks/ --include="*.tsx"
```

---

### 2.5 Navigation

**Reference:** DESIGN_SYSTEM.md Section 10 (Navigation)

**Files to Inspect:**
```
src/components/layout/top-nav.tsx
src/components/layout/bottom-nav.tsx
src/app/(dashboard)/layout.tsx
```

**Checklist:**
- [ ] Clean white background with bottom border
- [ ] Bridge logo on left
- [ ] User menu on right (avatar/initials)
- [ ] No login button for unauthenticated users
- [ ] Mobile bottom nav (if applicable)

**Audit Actions:**
```bash
# Check nav structure
grep -r "border-b\|bg-white" src/components/layout/top-nav.tsx

# Check logo usage
grep -r "bridge-logo\|bridge-icon" src/components/layout/ --include="*.tsx"
```

---

## 3. Visual Hierarchy Audit

### 3.1 Page Structure

**Check each major page for:**
- [ ] Clear primary heading (`text-2xl`)
- [ ] Descriptive subheading below (`text-gray-600`)
- [ ] Proper spacing: title → description (8px), description → controls (16px)
- [ ] Single focal point per section
- [ ] Consistent section spacing (`space-y-8`)

**Audit Actions:**
```bash
# Check page headings
grep -rE "text-2xl|text-xl" src/app/ --include="*.tsx"

# Check spacing between elements
grep -rE "space-y-|gap-|mb-|mt-" src/app/(dashboard)/ --include="*.tsx"
```

---

### 3.2 Information Density

**Check for appropriate density:**
- [ ] Perks catalog: Comfortable spacing, scannable cards
- [ ] Admin tables: Denser, information-focused
- [ ] Detail pages: Generous whitespace, reading-focused

**Expected Density:**
| Area | Card Padding | Grid Gap |
|------|-------------|----------|
| Perks grid | `p-4` | `gap-4` |
| Admin tables | `p-3` | `gap-2` |
| Detail page | `p-6` | `space-y-6` |

---

## 4. Icon Audit

**Reference:** DESIGN_SYSTEM.md Section 11 (Icons)

**Files to Inspect:**
```
src/components/layout/top-nav.tsx
src/components/perks/perk-card.tsx
src/components/ui/button.tsx
```

**Checklist:**
- [ ] All icons from Lucide React
- [ ] Line/outline style only (no filled icons)
- [ ] Consistent sizing: 16px (inline), 20px (default), 24px (prominent)
- [ ] Icons match adjacent text color
- [ ] Custom brand icons use correct SVG paths

**Audit Actions:**
```bash
# Check icon imports
grep -r "from 'lucide-react'" src/ --include="*.tsx"

# Check icon sizes
grep -rE "w-[0-9]|h-[0-9]" src/components/ --include="*.tsx" | grep -E "Icon|icon"

# Check for non-Lucide icons
grep -rE "from '@heroicons|from 'react-icons" src/ --include="*.tsx"
```

**Expected Icon Usage:**
```tsx
import { Search, LayoutGrid, List, ExternalLink, X } from 'lucide-react'

<Search className="w-4 h-4 text-gray-400" />      // Inline
<LayoutGrid className="w-5 h-5 text-gray-600" />  // Default
<ExternalLink className="w-6 h-6 text-gray-900" /> // Prominent
```

---

## 5. Animation & Transition Audit

**Reference:** DESIGN_SYSTEM.md Section 12 (Animations)

**Checklist:**
- [ ] Interactive elements have `transition-colors duration-150`
- [ ] Cards have subtle hover lift
- [ ] Dropdowns use `animate-fade-in`
- [ ] No jarring or excessive animations

**Audit Actions:**
```bash
# Check transition usage
grep -r "transition-" src/components/ --include="*.tsx"
grep -r "duration-" src/components/ --include="*.tsx"

# Check for animations
grep -r "animate-" src/components/ --include="*.tsx"
```

**Expected Patterns:**
```tsx
// Button/link hover
<button className="transition-colors duration-150 hover:bg-gray-100">

// Card hover
<div className="transition-shadow duration-150 hover:shadow-md">

// Dropdown enter
<div className="animate-fade-in">
```

---

## 6. Dark Mode Readiness (Future)

**If dark mode is needed, check:**
- [ ] All colors use semantic tokens (not hardcoded)
- [ ] Sufficient contrast in both modes
- [ ] Surface hierarchy uses lighter shades (not shadows alone)
- [ ] No pure black (`#000`) backgrounds

**Current Status:** Not implemented. If adding, update tailwind.config.js and DESIGN_SYSTEM.md first.

---

## 7. Responsive Design Audit

**Breakpoints:**
| Name | Width | Target |
|------|-------|--------|
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Small laptops |
| xl | 1280px | Desktops |

**Checklist:**
- [ ] Mobile: `px-4` padding, single-column layout
- [ ] Tablet: 2-column grids where appropriate
- [ ] Desktop: `px-6` padding, multi-column grids
- [ ] Cards stack on mobile, grid on desktop

**Audit Actions:**
```bash
# Check responsive classes
grep -rE "sm:|md:|lg:|xl:" src/components/ --include="*.tsx"

# Check grid responsiveness
grep -r "grid-cols-" src/components/ --include="*.tsx"
```

---

## 8. Audit Output Format

Document findings as:

```markdown
### Finding: [Issue Title]

**Severity:** 🔴 Critical / 🟡 Major / 🔵 Minor

**Category:** Color / Typography / Spacing / Components / Icons / Animation

**Location:** `src/path/to/file.tsx:line`

**Issue:** [What's wrong]

**Design System Reference:** DESIGN_SYSTEM.md Section X

**Fix:**
\`\`\`tsx
// Before
<div className="p-3 rounded-lg bg-blue-500">

// After
<div className="p-4 rounded-xl bg-[#0038FF]">
\`\`\`
```

---

## 9. Priority Matrix

### Critical (🔴)
- Brand color violations
- Major spacing inconsistencies
- Missing interactive states

### Major (🟡)
- Typography scale violations
- Border radius inconsistencies
- Icon style violations

### Minor (🔵)
- Micro-spacing tweaks
- Animation timing refinements
- Subtle visual polish

---

## 10. Post-Audit Actions

1. **Fix color tokens** first (most visible)
2. **Standardize spacing** across components
3. **Update component library** (ui/ folder)
4. **Propagate fixes** to feature components
5. **Update DESIGN_SYSTEM.md** if patterns change

---

**This audit is based on the ui-designer skill framework.**
**Reference DESIGN_SYSTEM.md for authoritative design decisions.**
