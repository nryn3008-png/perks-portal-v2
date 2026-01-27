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

## 2. Spacing System (8px Grid)

### 2.1 Base Rule (Non-Negotiable)

**All spacing must be a multiple of 8px.**

✅ **Allowed values:**
- 4px (exception only — see below)
- 8px
- 16px
- 24px
- 32px
- 40px
- 48px
- 64px

❌ **Disallowed:**
- 6px, 10px, 12px, 14px, 18px, etc.
- Arbitrary spacing "to make it look right"

---

### 2.2 4px Exception (Strict)

**4px may be used only for:**
- Icon ↔ text spacing (buttons, inline elements)
- Badge internal padding
- Very tight inline UI (icon + label)

❌ **Never use 4px for:**
- Page padding
- Section spacing
- Card padding
- Layout gaps

---

## 3. Page-Level Spacing

### Page Padding

- Default: **24px**
- Mobile (if applicable): **16px**

```
px-6 // 24px
px-4 // 16px
```

---

### Section Spacing

Spacing between major page sections:
- Default: **32px**
- Dense pages (rare): **40px**

```
space-y-8  // 32px
space-y-10 // 40px (rare)
```

---

## 4. Card Spacing Rules

### Card Padding

- Default: **16px**
- Dense/admin cards: **12px** (exception only)

```
p-4 // 16px
p-3 // 12px
```

---

### Inside Cards

- Logical group separation: **16px**
- Label ↔ value: **8px**

```
space-y-4 // 16px
space-y-2 // 8px
```

---

## 5. Grid & List Spacing

### Card Grids

- Default gap: **16px**
- Large layouts: **24px**

```
gap-4 // 16px
gap-6 // 24px
```

---

### Vertical Lists

- Compact lists: **8px**
- Standard lists: **16px**

```
space-y-2 // 8px
space-y-4 // 16px
```

---

## 6. Button System

### 6.1 Button Sizes

- **Small (sm)** → default everywhere
- **Large (lg)** → use only when explicitly required

If size is not specified, it must default to `sm`.

---

### 6.2 Button Variants

Use variants strictly by importance:

- **primary**
  - Only for the single most important action in a page or section
- **secondary, outline, ghost**
  - All secondary, tertiary, or navigational actions

**Rules:**
- Never use more than one primary button per visual group
- View toggles, filters, and switches must never be primary

---

### 6.3 Button Spacing

- Icon ↔ text: **8px**
- Between buttons (same group): **8px**
- Between button groups: **16px**

---

## 7. Search & Form Spacing

- Label ↔ input: **8px**
- Between form fields: **16px**
- Page title → search bar: **16px**
- Search bar → results: **24px**

Search input visuals must follow the **Arch Design System**.

---

## 8. Typography Spacing

- Page title → description: **8px**
- Description → controls (search / filters): **16px**
- Section title → content: **16px**

---

## 9. Alignment Rules

- Prefer `gap-*` and `space-*` utilities over margins
- Avoid stacking margins on parent + child
- One spacing source per axis

❌ **Bad:**
```
mt-4 mb-4 space-y-4
```

✅ **Good:**
```
space-y-4
```

---

## 10. Card Alignment Principles

Cards must align through:
- Structured layout slots
- Line clamping for text
- Conditional rendering (hide missing fields)
- Natural footer pinning via flex layout

❌ Do NOT use fixed heights
❌ Do NOT measure tallest card

---

## 11. Enforcement Rules

- Never introduce new spacing values
- Never eyeball spacing
- Never add spacing to compensate for layout bugs
  → Fix layout structure instead
- Similar components must use identical spacing rules

**If spacing feels "off", the structure is wrong.**

---

## 12. Ownership

**This design system is binding.**

All future UI work must:
- Follow this document
- Avoid ad-hoc overrides
- Update this file before breaking a rule

---

**Consistency is a feature.**
