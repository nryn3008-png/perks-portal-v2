# Perks Portal – Design System

**This document is authoritative.**
All UI changes (human or AI-generated) must comply with these rules.
If a rule must be broken, update this file first.

---

## 1. Core Principles

- **Consistency > creativity**
- **System-driven UI, not page-driven UI**
- **Calm, dense, scannable interfaces**
- **No visual noise, no ad-hoc fixes**

This design system exists to reduce decisions, not add them.

---

## 2. Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| Bridge Blue | `#0038FF` | Primary brand color, CTAs, active states, filter pills |
| Bridge Blue 10% | `#0038FF/10` | Subtle backgrounds (active filter pills) |
| Bridge Blue 20% | `#0038FF/20` | Hover state for filter pills |
| Bridge Blue 40% | `#0038FF/40` | Search bar hover border |

---

## 3. Typography

- **Font family:** Mulish (system fallback stack)
- **CSS variable:** `--font-mulish`
- **Heading sizes:** `text-2xl` (page titles), `text-base` (section headings)
- **Body sizes:** `text-[14px]` (primary), `text-[13px]` (secondary/meta), `text-[12px]` (pills/badges)

### Typography Spacing

- Page title → description: **8px**
- Description → controls (search / filters): **16px**
- Section title → content: **16px**

---

## 4. Spacing System (8px Grid)

### 4.1 Base Rule (Non-Negotiable)

**All spacing must be a multiple of 8px.**

Allowed values:
- 4px (exception only — see below)
- 8px, 16px, 24px, 32px, 40px, 48px, 64px

Disallowed:
- 6px, 10px, 12px, 14px, 18px, etc.
- Arbitrary spacing "to make it look right"

### 4.2 4px Exception (Strict)

**4px may be used only for:**
- Icon ↔ text spacing (buttons, inline elements)
- Badge internal padding
- Very tight inline UI (icon + label)

**Never use 4px for:**
- Page padding, section spacing, card padding, layout gaps

### Page-Level Spacing

- Page padding: **24px** (`px-6`), mobile: **16px** (`px-4`)
- Section spacing: **32px** (`space-y-8`), dense pages: **40px** (`space-y-10`)
- Card grid gap: **16px** (`gap-4`), large layouts: **24px** (`gap-6`)
- Filter bar gap: **8px** (`gap-2`)

### Card Spacing

- Card padding: **16px** (`p-4`), dense/admin: **12px** (`p-3`)
- Logical group separation inside cards: **16px** (`space-y-4`)
- Label ↔ value: **8px** (`space-y-2`)

---

## 5. Border Radius

| Element | Class | Style |
|---------|-------|-------|
| CTA buttons (landing page) | `rounded-full` | Fully rounded pill |
| Filter buttons (Stage dropdown) | `rounded-full` | Fully rounded pill |
| Sort dropdown | `rounded-full` | Fully rounded pill |
| View toggle (Grid / By vendor) | `rounded-full` | Fully rounded pill |
| Search bar | `rounded-full` | Fully rounded pill |
| Active filter pills | `rounded-full` | Fully rounded pill |
| Badges (New, offer type) | `rounded-full` | Fully rounded pill |
| Cards (offer, vendor) | `rounded-xl` | 12px rounded corners |
| Dropdown menus | `rounded-xl` | 12px rounded corners |

---

## 6. Button System

### 6.1 Button Sizes

- **Small (sm)** → default everywhere
- **Large (lg)** → use only when explicitly required

### 6.2 Button Variants

- **primary** — Only for the single most important action per visual group
- **secondary, outline, ghost** — All secondary, tertiary, or navigational actions
- View toggles, filters, and switches must never be primary

### 6.3 Button Spacing

- Icon ↔ text: **8px**
- Between buttons (same group): **8px**
- Between button groups: **16px**

### Primary CTA (Landing Page)
- `rounded-full` pill shape
- Bridge Blue background

### Filter / Sort Controls
- Pill-shaped (`rounded-full`) with subtle border
- Active state: white background, shadow, dark text
- Inactive state: transparent, gray text, hover reveals darker text

### View Toggle (Grid / By vendor)
- Contained in a `rounded-full` wrapper with light gray background
- Active tab: white background with shadow
- Icons: `LayoutGrid` for grid, `List` for vendor view

---

## 7. Search Bar

- **Default:** Light gray background, gray border
- **Hover:** White background, `border-[#0038FF]/40`
- **Focus:** White background, `border-[#0038FF]`, `ring-2 ring-[#0038FF]/20`
- **Shape:** `rounded-full`

### Search & Form Spacing

- Label ↔ input: **8px**
- Between form fields: **16px**
- Page title → search bar: **16px**
- Search bar → results: **24px**

---

## 8. Cards

### Offer Card
- `rounded-xl` with subtle border (`border-gray-200`)
- Glassmorphic hover effect (slight lift, shadow)
- Vendor logo + name in header
- Offer type badge (OFFER / DISCOUNT) below header
- Value tags at bottom (`$X off`, `$Xk value`)
- "View deal" link at footer

### Vendor Group (By Vendor View)
- Collapsible sections with vendor header
- Vendor logo, name, primary service area
- Offer count badge
- Cards within group use same Offer Card style

### Card Alignment Principles
- Structured layout slots
- Line clamping for text
- Conditional rendering (hide missing fields)
- Natural footer pinning via flex layout
- Do NOT use fixed heights or measure tallest card

---

## 9. Recently Added Section

- Shown only in **grid view** (hidden in vendor-grouped view)
- Green "New" badge (`bg-emerald-50`, `text-emerald-700`)
- "Recently Added" heading with count
- Displays offers first seen within 7 days (tracked via Supabase `offer_tracker`)

---

## 10. Navigation

### Top Nav
- Clean white background with bottom border
- Bridge logo on left
- User menu on right (avatar or initials circle)
- No login button for unauthenticated users

### User Menu Dropdown
- Avatar trigger (gradient fallback with user initial)
- Dropdown: "Signed in as" header, user info, Bridge account link
- Bridge account link uses actual Bridge icon (`/logos/bridge-icon.svg`)
- External link indicator

---

## 11. Icons

| Icon | Source | Usage |
|------|--------|-------|
| Bridge icon | `/logos/bridge-icon.svg` | User menu Bridge account link |
| Bridge logo | `/logos/bridge-logo.svg` | Top nav branding |
| LayoutGrid | Lucide | Grid view toggle |
| List | Lucide | Vendor view toggle |
| ExternalLink | Lucide | External link indicators |
| Search | Lucide | Search bar icon |
| X | Lucide | Clear/dismiss actions |

---

## 12. Animations

- **Transitions:** `transition-colors duration-150` on interactive elements
- **Dropdown:** `animate-fade-in` on menu open
- **Cards:** Subtle hover lift with shadow transition

---

## 13. Alignment Rules

- Prefer `gap-*` and `space-*` utilities over margins
- Avoid stacking margins on parent + child
- One spacing source per axis

---

## 14. Enforcement Rules

- Never introduce new spacing values
- Never eyeball spacing
- Never add spacing to compensate for layout bugs — fix layout structure instead
- Similar components must use identical spacing rules

**If spacing feels "off", the structure is wrong.**

---

## 15. Ownership

**This design system is binding.**

All future UI work must:
- Follow this document
- Avoid ad-hoc overrides
- Update this file before breaking a rule

---

**Consistency is a feature.**
