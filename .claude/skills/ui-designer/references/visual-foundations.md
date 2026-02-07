# Visual Foundations

## Table of Contents

1. Color Systems
2. Typography Systems
3. Spacing and Sizing Scales
4. Elevation and Shadow
5. Border Radius
6. Iconography Guidelines

---

## 1. Color Systems

### Building a Color Palette

**Primary color** — The brand's main action color. Used for primary buttons, links, active states, and key interactive elements. Choose one hue, then generate a 10-step scale (50–950) for flexibility.

**Neutral/Gray scale** — The workhorse palette. Used for text, backgrounds, borders, and disabled states. Generate a 10-step scale from near-white (50) to near-black (950).

**Semantic colors** — Fixed-meaning colors:
- Success: Green family (e.g., #16A34A). Use for confirmations, completed states, positive indicators.
- Warning: Amber/Yellow family (e.g., #D97706). Use for caution states, approaching limits.
- Error/Destructive: Red family (e.g., #DC2626). Use for errors, deletions, critical alerts.
- Info: Blue family (e.g., #2563EB). Use for informational banners, help text, neutral highlights.

**Secondary/Accent** — Optional. A complementary hue for visual variety. Use sparingly — badges, tags, illustrations, category indicators.

### Color Scale Generation (10-step)

A well-structured scale for any hue:
- **50** — Tinted background (near white with a hint of hue)
- **100** — Subtle background, hover states on light surfaces
- **200** — Borders on light backgrounds, secondary indicators
- **300** — Disabled text on dark backgrounds, decorative elements
- **400** — Placeholder text, secondary icons
- **500** — Mid-range — often the "base" for the hue
- **600** — Primary buttons, links, active states (most common interactive shade)
- **700** — Hover state for 600-level interactive elements
- **800** — Active/pressed state, high-emphasis text on light backgrounds
- **900** — Heading text, high-contrast elements
- **950** — Near-black tinted with hue, maximum contrast

### Contrast Requirements

- **Normal text** (<18px or <14px bold): Minimum 4.5:1 against background
- **Large text** (≥18px or ≥14px bold): Minimum 3:1 against background
- **UI components** (borders, icons, focus rings): Minimum 3:1 against adjacent colors
- **Decorative elements**: No minimum, but aim for 2:1 for visibility

### Dark Mode Approach

Invert the scale usage — light text on dark backgrounds. Key principles:
- Background surfaces: Use gray-900 (base), gray-800 (elevated), gray-850 (subtle)
- Text: Gray-50 (primary), gray-400 (secondary), gray-500 (tertiary)
- Primary color: Often shift to a lighter shade (500 → 400) to maintain contrast
- Avoid pure black (#000000) backgrounds — they create excessive contrast and eye strain
- Elevation in dark mode: Use lighter surfaces (not shadows) to indicate hierarchy

---

## 2. Typography Systems

### Font Selection Guidance

**Sans-serif families for UI:**
- System default stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` — zero load time, native feel
- Inter — Excellent for UI, wide character set, variable font, free
- Plus Jakarta Sans — Geometric, modern, good for product/SaaS
- DM Sans — Clean geometric, works well at small sizes
- Outfit — Contemporary, slightly rounded, friendly feel

**Serif families for editorial/content-heavy:**
- Source Serif 4, Lora, Merriweather — readable at body sizes
- Pair with a sans-serif for UI elements

**Monospace for code/data:**
- JetBrains Mono, Fira Code, SF Mono, IBM Plex Mono

### Type Scale

Use a modular scale with a consistent ratio. Common approach (base 16px, ratio ~1.25):

| Token          | Size   | Line Height | Use Case                        |
|----------------|--------|-------------|----------------------------------|
| text-xs        | 12px   | 16px (1.33) | Captions, badges, timestamps     |
| text-sm        | 14px   | 20px (1.43) | Secondary text, helper text      |
| text-base      | 16px   | 24px (1.5)  | Body text, input text            |
| text-lg        | 18px   | 28px (1.56) | Emphasized body, subheadings     |
| text-xl        | 20px   | 28px (1.4)  | Section headings                 |
| text-2xl       | 24px   | 32px (1.33) | Page section titles              |
| text-3xl       | 30px   | 36px (1.2)  | Page titles                      |
| text-4xl       | 36px   | 40px (1.11) | Hero headings                    |
| text-5xl       | 48px   | 48px (1.0)  | Display, marketing headlines     |

### Font Weight Usage

- **400 (Regular)** — Body text, descriptions, helper text
- **500 (Medium)** — Labels, navigation items, subtle emphasis
- **600 (Semibold)** — Subheadings, button labels, table headers
- **700 (Bold)** — Page titles, strong emphasis, key data points

Avoid using more than 3 weights in a single interface. Prefer weight + size combinations over excessive weight variation.

### Letter Spacing

- Headings (24px+): -0.01em to -0.02em (slight tightening)
- Body (14–18px): 0 (default)
- Small text (12px): +0.01em to +0.02em (slight loosening for readability)
- All caps text: +0.05em to +0.1em (always loosen)

---

## 3. Spacing and Sizing Scales

### Base-4 Spacing Scale

Use a base-4 system for all spacing, padding, margins, and gaps:

| Token   | Value | Common Use                                      |
|---------|-------|--------------------------------------------------|
| 0.5     | 2px   | Hairline gaps, icon-to-label micro spacing       |
| 1       | 4px   | Tight inner padding, inline element gaps         |
| 1.5     | 6px   | Compact component inner padding                  |
| 2       | 8px   | Default inner padding (small), tight gaps        |
| 3       | 12px  | Default inner padding (medium), list item gaps   |
| 4       | 16px  | Standard padding, gap between related elements   |
| 5       | 20px  | Comfortable padding, card inner padding          |
| 6       | 24px  | Section gaps, generous card padding              |
| 8       | 32px  | Section separation, larger content gaps          |
| 10      | 40px  | Major section dividers                           |
| 12      | 48px  | Page section spacing                             |
| 16      | 64px  | Large section breaks, hero padding               |
| 20      | 80px  | Maximum section spacing                          |
| 24      | 96px  | Page-level vertical rhythm                       |

### Sizing Conventions

**Touch targets:** Minimum 44×44px (mobile), 32×32px (desktop with spacing), 24×24px (desktop inline)

**Common component heights:**
- Small button/input: 32px
- Default button/input: 40px
- Large button/input: 48px

**Icon sizes:** 16px (inline), 20px (default), 24px (prominent), 32px (feature), 48px (hero)

---

## 4. Elevation and Shadow

### Shadow Scale

Use shadows to create depth hierarchy. Each level adds perceived elevation:

| Level     | Shadow Value                                        | Use Case                        |
|-----------|-----------------------------------------------------|---------------------------------|
| shadow-xs | 0 1px 2px rgba(0,0,0,0.05)                         | Subtle lift: cards, inputs      |
| shadow-sm | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) | Default card, dropdowns    |
| shadow-md | 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06) | Popovers, floating cards   |
| shadow-lg | 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) | Modals, dialogs           |
| shadow-xl | 0 20px 25px rgba(0,0,0,0.1), 0 8px 10px rgba(0,0,0,0.04) | Toast notifications, tooltips on scroll |

### Elevation Principles

- Higher elevation = more shadow = closer to user
- Persistent elements (nav, sidebar) sit at a consistent elevation
- Temporary overlays (modals, dropdowns) use higher elevation than the surface beneath
- In dark mode, use lighter surface colors instead of (or alongside) shadows

---

## 5. Border Radius

### Radius Scale

| Token      | Value | Use Case                                       |
|------------|-------|-------------------------------------------------|
| radius-none | 0    | Sharp edges: tables, full-bleed images          |
| radius-sm  | 4px   | Inputs, small buttons, tags, badges             |
| radius-md  | 8px   | Cards, modals, default buttons, containers      |
| radius-lg  | 12px  | Large cards, sheets, prominent containers       |
| radius-xl  | 16px  | Feature cards, hero sections, image frames      |
| radius-2xl | 24px  | Pills, fully rounded small elements             |
| radius-full | 9999px | Circles, avatar frames, round icon buttons   |

### Radius Consistency Rule

Nested elements should have progressively smaller radii. If a card has radius-lg (12px) and 16px padding, inner elements should use radius-md (8px) or radius-sm (4px) to maintain visual harmony.

---

## 6. Iconography Guidelines

**ALWAYS use line/outline icons. NEVER use emoji-style, filled cartoon, or illustrative icons in UI.** Icons should feel minimal, precise, and professional.

**Style** — Strictly outline/line style. Consistent stroke width across all icons. No mixing filled and outline in the same interface. The only exception: using a filled variant to indicate an "active" or "selected" state (e.g., outline heart → filled heart).

**Sizing** — Icons should align to the 4px grid. Common sizes: 16px (inline), 20px (default), 24px (prominent), 32px (feature), 48px (hero).

**Stroke weight** — Match icon stroke weight to the font weight used alongside it. A 1.5px stroke pairs well with regular (400) weight text. A 2px stroke pairs with medium/semibold.

**Color** — Icons generally use the same color as adjacent text. Interactive icons use the interactive color (primary). Never use multi-colored icons in UI.

**Recommended icon libraries (outline/line only):**
- Lucide — Clean, consistent, open source, great for products (preferred)
- Phosphor (outline weight) — Large set, flexible
- Heroicons (outline variant) — Tailwind-aligned
- SF Symbols (iOS, outline) — Required for native iOS feel
- Material Symbols (Android, outlined) — Required for Material Design compliance
