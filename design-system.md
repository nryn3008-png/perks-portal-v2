# Perks Portal v2 — Design System

> MercuryOS-inspired design language for the Bridge Perks Portal.

---

## Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| Bridge Blue | `#0038FF` | Primary brand color, CTAs, active states, filter pills |
| Bridge Blue 10% | `#0038FF/10` | Subtle backgrounds (active filter pills) |
| Bridge Blue 20% | `#0038FF/20` | Hover state for filter pills |
| Bridge Blue 40% | `#0038FF/40` | Search bar hover border |

## Typography

- **Font family:** Mulish (system fallback stack)
- **Heading sizes:** `text-2xl` (page titles), `text-base` (section headings)
- **Body sizes:** `text-[14px]` (primary), `text-[13px]` (secondary/meta), `text-[12px]` (pills/badges)

## Border Radius

| Element | Class | Style |
|---------|-------|-------|
| CTA buttons (landing page) | `rounded-full` | Fully rounded pill |
| Filter buttons (Stage dropdown) | `rounded-full` | Fully rounded pill |
| Sort dropdown | `rounded-full` | Fully rounded pill |
| View toggle (Grid / By vendor) | `rounded-full` | Fully rounded pill |
| Search bar | `rounded-full` | Fully rounded pill |
| Cards (offer, vendor) | `rounded-xl` | 12px rounded corners |
| Dropdown menus | `rounded-xl` | 12px rounded corners |
| Active filter pills | `rounded-full` | Fully rounded pill |
| Badges (New, offer type) | `rounded-full` | Fully rounded pill |

## Search Bar

- **Default:** Light gray background, gray border
- **Hover:** White background, `border-[#0038FF]/40`
- **Focus:** White background, `border-[#0038FF]`, `ring-2 ring-[#0038FF]/20`
- **Shape:** `rounded-full`

## Buttons & Controls

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

## Cards

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

## Recently Added Section

- Shown only in **grid view** (hidden in vendor-grouped view)
- Green "New" badge (`bg-emerald-50`, `text-emerald-700`)
- "Recently Added" heading with count
- Displays offers first seen within 7 days (tracked via Supabase `offer_tracker`)

## Navigation

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

## Icons

| Icon | Source | Usage |
|------|--------|-------|
| Bridge icon | `/logos/bridge-icon.svg` | User menu Bridge account link |
| Bridge logo | `/logos/bridge-logo.svg` | Top nav branding |
| LayoutGrid | Lucide | Grid view toggle |
| List | Lucide | Vendor view toggle |
| ExternalLink | Lucide | External link indicators |
| Search | Lucide | Search bar icon |
| X | Lucide | Clear/dismiss actions |

## Spacing

- **Page padding:** `px-6` (mobile), wider on desktop
- **Card grid gap:** `gap-4`
- **Section spacing:** `mb-8` between major sections
- **Filter bar gap:** `gap-2` between controls

## Animations

- **Transitions:** `transition-colors duration-150` on interactive elements
- **Dropdown:** `animate-fade-in` on menu open
- **Cards:** Subtle hover lift with shadow transition
