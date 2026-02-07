---
name: bridge-design-system
description: >
  Bridge's product design system with exact design tokens and implementation rules.
  ALWAYS use this skill when building any UI for Bridge products. Use these exact token
  values — never substitute, approximate, or invent new values. Covers colors, gradients,
  typography, spacing, shadows, border radius, buttons, cards, search, navigation, icons,
  and animations. Triggers on any UI implementation task, component building, styling,
  theming, or when referencing Bridge brand colors or design tokens.
---

# Bridge Design System

This is the single source of truth for Bridge's design tokens AND implementation rules. When building any UI for Bridge products, use ONLY these values. Never approximate, never invent new tokens.

**This document is authoritative.** All UI changes (human or AI-generated) must comply with these rules. If a rule must be broken, update this file first.

---

## Core Principles

- **Consistency > creativity** — System-driven UI, not page-driven UI
- **Calm, dense, scannable interfaces** — No visual noise, no ad-hoc fixes
- **This system reduces decisions, not adds them**

---

## How to Use This Skill

- **Before writing any CSS/Tailwind/styles**, check this file for the correct token values
- **When the ui-designer or frontend-developer skill is active**, this skill provides the actual values
- **If a needed token doesn't exist here**, flag it as a gap — don't invent one

---

## Colors

### Royal (Primary / Brand Blue)

The primary action and brand color. Used for buttons, links, active states, and key interactive elements.

| Token       | Hex       | Tailwind Usage | Usage                                    |
|-------------|-----------|----------------|------------------------------------------|
| Royal       | #0038FF   | `bg-[#0038FF]`, `text-[#0038FF]` | Primary buttons, CTAs, links |
| Royal 80    | #3360FF   | — | Hover state alternative, secondary emphasis |
| Royal 10    | #E6EBFF   | `bg-[#0038FF]/10` | Light background, active tab bg |
| Royal 07    | #EDF1FF   | — | Subtle background, hover on light surfaces |
| Royal 05    | #F2F5FF   | — | Very light tint, section backgrounds |
| Royal 02    | #FAFBFF   | — | Near-white tinted background |
| Royal S10   | #0036D7   | — | Hover/pressed state for Royal buttons |

**Bridge Blue shorthand tokens (Tailwind):**

| Token | Value | Usage |
|-------|-------|-------|
| Bridge Blue 10% | `#0038FF/10` | Subtle backgrounds (active filter pills) |
| Bridge Blue 20% | `#0038FF/20` | Hover state for filter pills |
| Bridge Blue 40% | `#0038FF/40` | Search bar hover border |

### Charcoal (Dark Neutrals / Text)

| Token        | Hex       | Usage                                          |
|--------------|-----------|------------------------------------------------|
| Charcoal     | #0D1531   | Primary text, headings, high-emphasis content   |
| Charcoal 80  | #3D445A   | Secondary text, body copy                       |
| Charcoal 70  | #676C7E   | Tertiary text, captions, helper text            |

### Slate (Light Neutrals / Borders / Backgrounds)

| Token     | Hex       | Usage                                            |
|-----------|-----------|--------------------------------------------------|
| Slate 100 | #81879C   | Placeholder text, disabled text                  |
| Slate 80  | #9A9FB0   | Secondary icons, muted text                      |
| Slate 60  | #B3B7C4   | Borders on dark surfaces, disabled icons         |
| Slate 30  | #D9DBE1   | Default borders, dividers                        |
| Slate 20  | #E6E8ED   | Subtle borders, table dividers                   |
| Slate 15  | #ECEDF0   | Light borders, input borders                     |
| Slate 10  | #F2F3F5   | Page background, card background on white        |
| Slate 05  | #F9F9FA   | Subtle background, hover on gray surfaces        |

### Sky (Secondary Blue / Informational)

| Token     | Hex       | Usage                                            |
|-----------|-----------|--------------------------------------------------|
| Sky       | #568FFF   | Info icons, secondary blue actions               |
| Sky 20    | #DDE9FF   | Info badge background, highlight                 |
| Sky 15    | #E6EEFF   | Light info background                            |
| Sky 10    | #EEF4FF   | Subtle info tint                                 |
| Muted sky | #97B0C8   | Muted decorative blue, illustrations             |

### Kelly (Success / Green)

| Token     | Hex       | Usage                                            |
|-----------|-----------|--------------------------------------------------|
| Kelly     | #0EA02E   | Success icons, positive indicators, checkmarks   |
| Kelly 60  | #6EC682   | Success text on dark backgrounds                 |
| Kelly 20  | #CFECD5   | Success badge background                         |
| Kelly 15  | #DBF1E0   | Light success background                         |
| Kelly 10  | #E7F6EA   | Subtle success tint, success alert bg            |
| Kelly S10 | #005F15   | Dark success text, success on light backgrounds  |

### Honey (Warning / Amber)

| Token     | Hex       | Usage                                            |
|-----------|-----------|--------------------------------------------------|
| Honey     | #E19500   | Warning icons, caution indicators                |
| Honey 70  | #EBB449   | Warning text on dark backgrounds                 |
| Honey 20  | #F9EACC   | Warning badge background                         |
| Honey 15  | #FBEFD9   | Light warning background                         |
| Honey 10  | #FCF4E6   | Subtle warning tint, warning alert bg            |
| Honey S10 | #714A00   | Dark warning text, warning on light backgrounds  |

### Ruby (Error / Destructive / Red)

| Token     | Hex       | Usage                                            |
|-----------|-----------|--------------------------------------------------|
| Ruby      | #E13535   | Error icons, destructive buttons, error borders  |
| Ruby 20   | #F9D7D7   | Error badge background                           |
| Ruby 10   | #FCEBEB   | Subtle error tint, error alert bg                |
| Ruby S10  | #9E0000   | Dark error text, error on light backgrounds      |

### Purple (Accent / Feature)

| Token        | Hex       | Usage                                          |
|--------------|-----------|------------------------------------------------|
| Purple dark  | #3F3181   | Dark purple for high-emphasis accents          |
| Royal purple | #7450DA   | Purple accent, feature highlights              |
| Purple S10   | #552BCB   | Darker purple for hover/pressed states         |
| Purple 20    | #ECE5FF   | Purple badge background, light accent bg       |
| Purple 15    | #F1ECFF   | Light purple background                        |
| Purple 10    | #F6F2FF   | Subtle purple tint                             |

### Graphics Palette (Illustrations Only)

These colors are for illustrations, charts, data visualization, and marketing graphics ONLY. Do not use for UI components.

| Token   | Hex       |
|---------|-----------|
| Purple  | #A07FFF   |
| Green   | #86CF97   |
| Yellow  | #EBB449   |
| Blue    | #628AFF   |
| Red     | #EB7171   |

### Semantic Color Quick Reference

| Purpose              | Default         | Hover/Dark       | Light BG         | Subtle BG       |
|----------------------|-----------------|------------------|------------------|-----------------|
| **Primary action**   | Royal #0038FF   | Royal S10 #0036D7| Royal 10 #E6EBFF | Royal 05 #F2F5FF|
| **Success**          | Kelly #0EA02E   | Kelly S10 #005F15| Kelly 20 #CFECD5 | Kelly 10 #E7F6EA|
| **Warning**          | Honey #E19500   | Honey S10 #714A00| Honey 20 #F9EACC | Honey 10 #FCF4E6|
| **Error/Destructive**| Ruby #E13535    | Ruby S10 #9E0000 | Ruby 20 #F9D7D7  | Ruby 10 #FCEBEB |
| **Info**             | Sky #568FFF     | —                | Sky 20 #DDE9FF   | Sky 10 #EEF4FF  |
| **Accent**           | Royal purple #7450DA | Purple S10 #552BCB | Purple 20 #ECE5FF | Purple 10 #F6F2FF |

| Purpose              | Token             | Hex       |
|----------------------|-------------------|-----------|
| **Primary text**     | Charcoal          | #0D1531   |
| **Secondary text**   | Charcoal 80       | #3D445A   |
| **Tertiary text**    | Charcoal 70       | #676C7E   |
| **Placeholder text** | Slate 100         | #81879C   |
| **Borders**          | Slate 30          | #D9DBE1   |
| **Subtle borders**   | Slate 15          | #ECEDF0   |
| **Page background**  | Slate 10          | #F2F3F5   |
| **Surface/Card bg**  | White             | #FFFFFF   |

---

## Gradients

Use gradients sparingly — primarily for hero sections, feature cards, and marketing elements. Never for standard UI components like buttons or inputs.

| Token          | From      | To        | Usage                                    |
|----------------|-----------|-----------|------------------------------------------|
| Royal strong   | #0038FF   | #0085FF   | Primary gradient, hero sections          |
| Royal subtle   | #0038FF   | #0066FF   | Subtle brand gradient, headers           |
| Purple sky     | #5795FF   | #5C5DFF   | Feature highlights, special sections     |
| Purple strong  | #6A3AF3   | #7A80FF   | Premium/accent gradient                  |
| Royal purple   | #0038FF   | #A07FFF   | Bold brand gradient, marketing           |
| Slate light    | #F2F3F5   | #FFFFFF   | Subtle background gradient, cards        |
| Kelly strong   | #0EA02E   | #56C13B   | Success/positive gradient (use rarely)   |

```css
background: linear-gradient(135deg, #0038FF, #0085FF); /* Royal strong example */
```

---

## Typography

**Font family:** Mulish (Google Fonts)
**CSS variable:** `--font-mulish`

```css
font-family: 'Mulish', sans-serif;
```

### Type Scale

| Token             | Size  | Weight       | Line Height | Usage                                |
|-------------------|-------|--------------|-------------|--------------------------------------|
| Display 2         | 48px  | Bold (700)   | Default     | Hero headings, landing page titles   |
| Display 1         | 34px  | Bold (700)   | Default     | Page titles, major section headers   |
| Heading 1 Bold    | 28px  | Bold (700)   | Default     | Section headings (emphasized)        |
| Heading 1         | 28px  | Regular (400)| Default     | Section headings (neutral)           |
| Heading 2         | 18px  | Bold (700)   | Default     | Subsection headings, card titles     |
| Heading 3         | 16px  | Bold (700)   | Default     | Small section headings, label groups |
| Subtitle 1        | 16px  | Regular (400)| Default     | Subtitles, supporting headings       |
| Subtitle 2        | 14px  | Regular (400)| Default     | Smaller subtitles, meta info         |

### Body Text

| Token             | Size  | Weight       | Line Height | Usage                               |
|-------------------|-------|--------------|-------------|--------------------------------------|
| Body 1            | 16px  | Regular (400)| Default     | Primary body text                    |
| Body 1 Bold       | 16px  | Bold (700)   | Default     | Emphasized body text                 |
| Body 2            | 14px  | Regular (400)| Default     | Secondary body text                  |
| Body 2 Bold       | 14px  | Bold (700)   | Default     | Emphasized secondary text            |
| Body 2 Bold U     | 14px  | Bold (700)   | Default     | Bold underlined links/actions        |
| Body 3            | 14px  | Regular (400)| 20px        | Compact body text (tighter leading)  |
| Body 3 Bold       | 14px  | Bold (700)   | 20px        | Compact emphasized text              |
| Body 4            | 16px  | Regular (400)| 22px        | Relaxed body text (looser leading)   |
| Body 4 Bold       | 16px  | Bold (700)   | 22px        | Relaxed emphasized text              |

### Small / Utility Text

| Token             | Size  | Weight         | Style      | Usage                              |
|-------------------|-------|----------------|------------|-------------------------------------|
| Caption           | 12px  | Regular (400)  | Normal     | Captions, timestamps, footnotes     |
| Overline          | 10px  | Bold (700)     | UPPERCASE  | Section labels, category tags       |
| Small 1           | 13px  | Bold (700)     | Normal     | Badges, counters, small labels      |
| Sticker           | 8px   | Bold (700)     | UPPERCASE  | Tiny labels, status stickers        |

### Button Text

| Token             | Size  | Weight          | Letter Spacing | Usage                     |
|-------------------|-------|-----------------|----------------|----------------------------|
| Button (lg)       | 16px  | SemiBold (600)  | 0.4px          | Large/default buttons      |
| Button (sm)       | 14px  | SemiBold (600)  | 0.4px          | Small buttons              |
| Button (sm alt)   | 14px  | Bold (700)      | 0.4px          | Small button alternate     |

### Tailwind Size Mapping

| Figma Token | Tailwind Class | Usage |
|-------------|----------------|-------|
| Display 2 (48px) | — | Landing page hero only |
| Display 1 (34px) | — | Landing page only |
| Heading 2 (18px) | `text-lg` | Section headings |
| Heading 3 (16px) | `text-base` | Section headings in-app |
| Body 2 (14px) | `text-[14px]` | Primary in-app body text |
| Small 1 (13px) | `text-[13px]` | Secondary/meta text |
| Caption (12px) | `text-[12px]` | Pills, badges, timestamps |

### Typography Spacing

| Between | Gap |
|---------|-----|
| Page title → description | 8px |
| Description → controls (search/filters) | 16px |
| Section title → content | 16px |

### Typography Rules

- **Headings:** Always Bold (700) unless intentionally de-emphasizing with Regular (400)
- **Body text:** Regular (400) for reading, Bold (700) for emphasis
- **Buttons:** SemiBold (600) default, Bold (700) for small buttons
- **Uppercase:** Only for Overline and Sticker — never uppercase headings or body text
- **Underlines:** Only for inline links within body text (Body 2 Bold U)

---

## Spacing System (8px Grid)

### Base Rule (Non-Negotiable)

**All spacing must be a multiple of 8px.** No exceptions except the 4px rule below.

Allowed values: 4px (exception only), 8px, 12px, 16px, 24px, 32px, 40px, 48px, 64px

Disallowed: 6px, 10px, 14px, 18px, or arbitrary spacing "to make it look right"

### Design Tokens

| Token           | Value | Tailwind | Usage                                    |
|-----------------|-------|----------|------------------------------------------|
| spacing-sm      | 8px   | `gap-2`, `p-2` | Tight padding, small gaps between related items |
| spacing-md      | 12px  | `gap-3`, `p-3` | Compact component padding, list item gaps |
| spacing-default | 16px  | `gap-4`, `p-4` | Default padding, gap between related elements |
| spacing-lg      | 24px  | `gap-6`, `p-6` | Card padding, section gaps |
| spacing-xl      | 32px  | `space-y-8` | Section separation, generous card padding |
| spacing-xxl     | 64px  | `space-y-16` | Large section breaks, hero padding |

### 4px Exception (Strict)

**4px may be used ONLY for:**
- Icon ↔ text spacing (buttons, inline elements)
- Badge internal padding
- Very tight inline UI (icon + label)

**Never use 4px for:** Page padding, section spacing, card padding, layout gaps

### Page-Level Spacing

| Context | Value | Tailwind |
|---------|-------|----------|
| Page padding | 24px | `px-6` |
| Page padding (mobile) | 16px | `px-4` |
| Section spacing | 32px | `space-y-8` |
| Section spacing (dense) | 40px | `space-y-10` |
| Card grid gap | 16px | `gap-4` |
| Card grid gap (large) | 24px | `gap-6` |
| Filter bar gap | 8px | `gap-2` |

### Card Spacing

| Context | Value | Tailwind |
|---------|-------|----------|
| Card padding | 16px | `p-4` |
| Card padding (dense/admin) | 12px | `p-3` |
| Group separation inside cards | 16px | `space-y-4` |
| Label ↔ value | 8px | `space-y-2` |

### Search & Form Spacing

| Context | Value |
|---------|-------|
| Label ↔ input | 8px |
| Between form fields | 16px |
| Page title → search bar | 16px |
| Search bar → results | 24px |

### Spacing Enforcement Rules

- **Never introduce new spacing values**
- **Never eyeball spacing**
- **Never add spacing to compensate for layout bugs** — fix the layout structure instead
- **Similar components must use identical spacing**
- **If spacing feels "off", the structure is wrong**
- Prefer `gap-*` and `space-*` utilities over margins
- Avoid stacking margins on parent + child
- One spacing source per axis

---

## Shadows / Elevation

| Token    | CSS Value                                | Usage                                    |
|----------|------------------------------------------|------------------------------------------|
| Ds1      | `0px 1px 3px rgba(0, 0, 0, 0.1)`        | Cards, inputs, subtle lift               |
| Ds2      | `0px 3px 10px rgba(0, 0, 0, 0.1)`       | Dropdowns, popovers, elevated cards      |
| Ds3      | `0px 6px 20px rgba(0, 0, 0, 0.1)`       | Modals, dialogs, sheets                  |
| Hover 1  | `0px 6px 20px rgba(0, 0, 0, 0.15)`      | Hover state for interactive cards        |

**Elevation rules:**
- Ds1 → Default resting state for cards and containers
- Ds2 → Floating elements (dropdowns, tooltips, popovers)
- Ds3 → Overlays (modals, dialogs, side sheets)
- Hover 1 → Card hover (`transition: box-shadow 200ms ease`)

---

## Border Radius

### Design Tokens

| Token           | Value    | Usage                                          |
|-----------------|----------|-------------------------------------------------|
| radius-sm       | 2px      | Subtle rounding — tags, small badges            |
| radius-md       | 4px      | Inputs, small buttons, table cells              |
| radius-default  | 8px      | Cards, modals, default containers               |
| radius-lg       | 16px     | Large cards, sheets, feature containers          |
| radius-round    | 1000px   | Pills, avatars, fully rounded buttons            |

### Element-Specific Mapping

| Element | Class | Value |
|---------|-------|-------|
| CTA buttons | `rounded-full` | Pill shape |
| Filter buttons | `rounded-full` | Pill shape |
| Sort dropdown trigger | `rounded-full` | Pill shape |
| View toggle | `rounded-full` | Pill shape |
| Search bar | `rounded-full` | Pill shape |
| Active filter pills | `rounded-full` | Pill shape |
| Badges (New, offer type) | `rounded-full` | Pill shape |
| Cards (offer, vendor) | `rounded-xl` | 12px |
| Dropdown menus | `rounded-xl` | 12px |
| Modals/dialogs | `rounded-xl` | 12px |

---

## Component Tokens: Buttons

All buttons use `border-radius: 100px` (fully rounded / pill), `font-family: Mulish`, `font-weight: 600 (SemiBold)`, and `letter-spacing: 0.4px`.

### Sizes

| Size  | Height | Padding (text)  | Padding (icon-only) | Font Size | Icon Size | Gap  |
|-------|--------|-----------------|----------------------|-----------|-----------|------|
| Large | 48px   | 12px 24px       | 12px                 | 16px      | 24px      | 10px |
| Small | 32px   | 4px 14px        | 4px 8px              | 14px      | 16px      | 6px  |

**Size rule:** Small (`sm`) is the default everywhere. Large (`lg`) only when explicitly required.

### Styles

| Style        | Fill               | Outline Border      | Text Color   | Icon Color   | Usage                        |
|--------------|--------------------|----------------------|--------------|--------------|------------------------------|
| **Primary**  | Royal #0038FF      | —                    | White #FFF   | White #FFF   | Main CTAs, primary actions   |
| **Primary Outline** | Transparent | 1px solid #0038FF   | Royal #0038FF| Royal #0038FF| Secondary emphasis on Royal  |
| **Secondary Outline** | Transparent | 1px solid Slate 60 #B3B7C4 | Charcoal #0D1531 | Charcoal #0D1531 | Default secondary actions |
| **Destructive Outline** | Transparent | 1px solid Ruby #E13535 | Ruby #E13535 | Ruby #E13535 | Delete, remove, destructive  |
| **White Outline** | Transparent  | 1px solid #FFFFFF   | White #FFF   | White #FFF   | On dark/image backgrounds    |
| **Locked**   | Slate 30 #D9DBE1   | —                    | White #FFF   | White #FFF   | Locked/unavailable areas     |

### Button Variant Rules

- **Primary** — Only for the single most important action per visual group
- **Secondary, Outline, Ghost** — All secondary, tertiary, or navigational actions
- View toggles, filters, and switches must **never** be primary

### States

| State    | Treatment                                          |
|----------|----------------------------------------------------|
| Default  | As specified above                                 |
| Hover    | See hover color specs from Figma (per style)       |
| Disabled | `opacity: 0.3` applied to entire button            |
| Loading  | Replace label with spinner, maintain button width  |

### Text Links (Button as Link)

No background, no border — text only with button typography.

| Style              | Text Color        | Font       | Usage                      |
|--------------------|-------------------|------------|----------------------------|
| Primary text link  | Royal #0038FF     | 16px/14px SemiBold | Inline actions, "View all" |
| Secondary text link| Charcoal 80 #3D445A| 16px/14px SemiBold | Less prominent actions     |
| Destructive text link | Ruby #E13535   | 16px/14px SemiBold | "Delete", "Remove"         |
| White text link    | White #FFFFFF     | 16px/14px SemiBold | On dark backgrounds        |
| Locked text link   | Slate 60 #B3B7C4  | 16px/14px SemiBold | Unavailable actions        |

### Button Spacing

| Context | Value |
|---------|-------|
| Icon ↔ text | 8px |
| Between buttons (same group) | 8px |
| Between button groups | 16px |

### Button Groups

Primary action on the left, secondary on the right. Icons are hidden by default — toggle on when needed. Icon-only buttons use square dimensions (48×48 large, 32×32 small).

---

## Component: Search Bar

| State | Background | Border | Extra |
|-------|-----------|--------|-------|
| Default | Light gray | Gray border | — |
| Hover | White | `border-[#0038FF]/40` | — |
| Focus | White | `border-[#0038FF]` | `ring-2 ring-[#0038FF]/20` |

Shape: `rounded-full`

---

## Component: Cards

### Offer Card

- `rounded-xl` with subtle border (`border-gray-200`)
- Glassmorphic hover effect (slight lift + shadow transition to Hover 1)
- Structure: Vendor logo + name header → offer type badge (OFFER/DISCOUNT) → description → value tags at bottom (`$X off`, `$Xk value`) → "View deal" link footer

### Vendor Group (By Vendor View)

- Collapsible sections with vendor header
- Vendor logo, name, primary service area
- Offer count badge
- Cards within group use same Offer Card style

### Card Alignment Rules

- Structured layout slots
- Line clamping for text overflow
- Conditional rendering (hide missing fields, don't show empty space)
- Natural footer pinning via flex layout
- **Do NOT use fixed heights or measure tallest card**

---

## Component: Filter & Sort Controls

- Pill-shaped (`rounded-full`) with subtle border
- **Active state:** White background, shadow, dark text
- **Inactive state:** Transparent, gray text, hover reveals darker text

### View Toggle (Grid / By Vendor)

- Contained in a `rounded-full` wrapper with light gray background
- Active tab: White background with shadow
- Icons: `LayoutGrid` for grid, `List` for vendor view

---

## Recently Added Section

- Shown only in **grid view** (hidden in vendor-grouped view)
- Green "New" badge: `bg-emerald-50`, `text-emerald-700`
- "Recently Added" heading with count
- Displays offers first seen within 7 days (tracked via Supabase `offer_tracker.first_seen`)

---

## Navigation

### Top Nav

- Clean white background with bottom border
- Bridge logo on left
- User menu on right (avatar or initials circle)
- No login button for unauthenticated users

### User Menu Dropdown

- Avatar trigger (gradient fallback with user initial)
- Dropdown: "Signed in as" header → user info → Bridge account link
- Bridge account link uses `/logos/bridge-icon.svg`
- External link indicator on external links

---

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

**Icon library:** Lucide React (`lucide-react`)

---

## Animations

- **Transitions:** `transition-colors duration-150` on interactive elements
- **Dropdown:** `animate-fade-in` on menu open
- **Cards:** Subtle hover lift with shadow transition (`transition: box-shadow 200ms ease`)
- **Landing page:** Scroll-triggered animations, staggered entrances, animated counters, infinite partner marquee — all must respect `prefers-reduced-motion`

---

## Enforcement Rules

1. Never introduce new spacing values
2. Never eyeball spacing
3. Never add spacing to compensate for layout bugs — fix layout structure instead
4. Similar components must use identical spacing rules
5. Never use indigo — use Bridge Blue / Royal
6. Never use system fonts in UI — Mulish only
7. All buttons are `rounded-full` (pill shape)
8. All cards are `rounded-xl`
9. No ad-hoc overrides without updating this file first

**Consistency is a feature.**

---

## TODO: Tokens Needed

- [ ] **Input fields** — Heights, padding, border styles, states (from Figma)
- [ ] **Dark mode** — If applicable
