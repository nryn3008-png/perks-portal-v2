# Layout Patterns

## Table of Contents

1. Grid Systems
2. Common Page Layouts
3. Responsive Breakpoints
4. Component Layout Patterns
5. Spatial Relationships

---

## 1. Grid Systems

### 12-Column Grid (Web)

The standard for web layouts. Provides maximum flexibility for dividing content into halves, thirds, quarters, and sixths.

**Configuration:**
- Columns: 12
- Gutter (gap between columns): 24px (comfortable) or 16px (compact)
- Margin (outer padding): 24–80px depending on viewport
- Max content width: 1280px (standard) or 1440px (wide) — beyond this, center the content

**Common column spans:**
- Full width: 12 cols
- Two equal halves: 6 + 6
- Content + sidebar: 8 + 4 or 9 + 3
- Three equal: 4 + 4 + 4
- Four equal: 3 + 3 + 3 + 3
- Asymmetric feature: 7 + 5

### 4-Column Grid (Mobile)

**Configuration:**
- Columns: 4
- Gutter: 16px
- Margin: 16px (standard) or 20px (comfortable)

Content typically spans all 4 columns on mobile. Use 2 + 2 for small card grids.

### 8-Column Grid (Tablet)

**Configuration:**
- Columns: 8
- Gutter: 20px
- Margin: 24px

Acts as a bridge between mobile and desktop layouts.

---

## 2. Common Page Layouts

### Dashboard Layout

```
┌─────────────────────────────────────────┐
│  Top Nav (56–64px height)               │
├────────┬────────────────────────────────┤
│        │                                │
│ Side   │  Main Content Area             │
│ Nav    │  ┌──────┐ ┌──────┐ ┌──────┐   │
│        │  │ Card │ │ Card │ │ Card │   │
│ 240px  │  └──────┘ └──────┘ └──────┘   │
│ or     │                                │
│ 280px  │  ┌─────────────────────────┐   │
│        │  │ Table / Chart           │   │
│        │  └─────────────────────────┘   │
└────────┴────────────────────────────────┘
```

- Sidebar: 240px (compact) or 280px (comfortable), collapsible to 64px (icon-only)
- Top nav: 56px (compact) or 64px (standard)
- Content area: Fluid, with max-width container or full-bleed
- Content padding: 24–32px

### Content/Article Layout

```
┌─────────────────────────────────────────┐
│  Top Nav                                │
├─────────────────────────────────────────┤
│              Max-width 720px            │
│         ┌───────────────────┐           │
│         │  Title             │           │
│         │  Meta              │           │
│         │  Body content      │           │
│         │  ...               │           │
│         └───────────────────┘           │
└─────────────────────────────────────────┘
```

- Content max-width: 680–720px for readability (65–75 characters per line)
- Images/media can break out to wider (up to 960px or full-bleed)
- Generous vertical spacing between sections: 48–64px

### Settings / Form Layout

```
┌─────────────────────────────────────────┐
│  Top Nav                                │
├────────┬────────────────────────────────┤
│        │                                │
│ Side   │  Section Title                 │
│ Tabs   │  Description text              │
│        │  ┌─────────────────────────┐   │
│        │  │ Form fields (max 560px) │   │
│        │  └─────────────────────────┘   │
│        │                                │
│        │  Section Title                 │
│        │  ...                           │
└────────┴────────────────────────────────┘
```

- Side navigation for sections (vertical tabs or anchor links)
- Form fields max-width: 480–560px (prevents overly wide inputs)
- Group related fields with section dividers and 32–48px spacing between groups

### Marketing / Landing Page

```
┌─────────────────────────────────────────┐
│  Nav (transparent or solid)             │
├─────────────────────────────────────────┤
│  Hero Section (full-width, 60–80vh)     │
├─────────────────────────────────────────┤
│  Feature Section (alternating layout)   │
├─────────────────────────────────────────┤
│  Social Proof / Testimonials            │
├─────────────────────────────────────────┤
│  CTA Section                            │
├─────────────────────────────────────────┤
│  Footer                                 │
└─────────────────────────────────────────┘
```

- Sections: Full-width backgrounds, centered content (max 1200px)
- Section vertical padding: 80–120px
- Hero: Single clear CTA, supporting text, optional visual

---

## 3. Responsive Breakpoints

### Standard Breakpoints

| Name | Min-width | Target Devices                  |
|------|-----------|----------------------------------|
| sm   | 640px     | Large phones (landscape)         |
| md   | 768px     | Tablets (portrait)               |
| lg   | 1024px    | Tablets (landscape), small laptops |
| xl   | 1280px    | Desktops                         |
| 2xl  | 1536px    | Large desktops                   |

### Responsive Behavior Patterns

**Stack → Side-by-side:** Elements stacked vertically on mobile, horizontal on desktop. Most common pattern for card grids, feature sections.

**Collapse navigation:** Full nav visible on desktop, hamburger or bottom tab bar on mobile.

**Hide secondary content:** Sidebar content moves to a sheet/modal on mobile. Secondary columns collapse below primary.

**Adjust density:** Increase padding and touch targets on mobile, allow tighter spacing on desktop.

**Reflow tables:** Tables become card lists on mobile, or scroll horizontally with a fixed first column.

---

## 4. Component Layout Patterns

### Card Layouts

**Grid of cards:** Use CSS Grid with auto-fill/auto-fit for responsive card grids.
- Min card width: 280px (content cards), 200px (compact), 320px (feature)
- Gap: 16–24px
- Cards in a row should have equal heights (use flexbox or grid stretch)

**List of cards:** Single column, full-width cards stacked vertically.
- Gap: 8–16px
- Good for feeds, activity logs, settings items

### Form Layouts

**Single column:** Default for most forms. Fields stack vertically, full width of container.
- Field gap: 16–24px
- Label-to-input gap: 6–8px
- Section gap: 32–48px

**Two column:** Only for short, related fields (first name + last name, city + state).
- Gap between columns: 16–24px
- Never split labels and their inputs across columns

**Inline fields:** Small inputs on one line (quantity + unit, amount + currency).
- Use for tightly coupled fields only
- Gap: 8–12px

### Navigation Patterns

**Top navigation:** Horizontal bar, fixed or sticky. Logo left, nav items center or right, actions far right.
- Height: 56–64px
- Item spacing: 8–12px gap between nav items
- Use for apps with 3–7 top-level sections

**Side navigation:** Vertical bar, fixed. Logo/brand at top, nav items below, user/settings at bottom.
- Width: 240–280px (expanded), 64px (collapsed icon-only)
- Item height: 40–44px
- Item padding: 8–12px vertical, 12–16px horizontal
- Use for apps with 5+ sections or deep hierarchies

**Bottom tab bar (mobile):** Fixed to bottom, 3–5 tabs maximum.
- Height: 56–64px (including safe area on iOS)
- Icon + label per tab
- Active state: filled icon + primary color

---

## 5. Spatial Relationships

### Proximity Principle

Related items should be closer together than unrelated items. The gap between elements communicates their relationship:

- **Tight (4–8px):** Strongly related — label and its input, icon and its label, avatar and name
- **Default (12–16px):** Grouped — items within the same section, list items, form fields
- **Loose (24–32px):** Section-level — between groups of related content
- **Separated (48–64px):** Distinct sections — between major page regions

### Container Padding Rules

- **Small components** (buttons, badges, tags): 8–12px horizontal, 4–8px vertical
- **Medium components** (cards, inputs, list items): 16–20px
- **Large containers** (modals, sections, panels): 24–32px
- **Page-level**: 16px (mobile), 24–32px (tablet), 32–80px (desktop)

### Alignment Rules

- Left-align body text (never center paragraphs, only center short headlines/CTAs)
- Align form labels consistently — either all above inputs or all to the left
- Align numbers and currency to the right in tables
- Center short UI text only (buttons, badges, nav items, empty states)
