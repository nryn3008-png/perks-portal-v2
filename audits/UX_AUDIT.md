# Perks Portal – UX Audit Guide

**Purpose:** This document provides a comprehensive UX audit framework for Claude Code to evaluate and improve the Perks Portal application. Run this audit systematically to identify and fix usability issues.

---

## How to Use This Audit

1. **Read each section** and its evaluation criteria
2. **Inspect the relevant files** listed for each area
3. **Categorize findings** by severity (🔴 Critical, 🟡 Major, 🔵 Minor)
4. **Implement fixes** with the recommended approach
5. **Document changes** in commit messages

---

## 1. Nielsen's 10 Heuristics Evaluation

### H1 — Visibility of System Status

**What to Check:**
- [ ] Loading indicators on all async operations
- [ ] Progress feedback during data fetching
- [ ] Success/error states after actions
- [ ] Active navigation state highlighting
- [ ] Filter selection visual feedback

**Files to Inspect:**
```
src/app/(dashboard)/perks/loading.tsx
src/app/(dashboard)/perks/[id]/loading.tsx
src/components/perks/*.tsx
src/components/ui/button.tsx
```

**Audit Actions:**
```bash
# Search for loading states
grep -r "loading" src/components/ --include="*.tsx"
grep -r "isLoading" src/ --include="*.tsx"
grep -r "Skeleton" src/ --include="*.tsx"

# Check for loading spinners
grep -r "spinner\|Loader\|Loading" src/ --include="*.tsx"
```

**Expected Patterns:**
- Every button with async action should have loading state
- Every data fetch should show skeleton or loading indicator
- Every form submission should disable submit + show spinner
- Active nav items should be visually distinct

**Fix Template:**
```tsx
// Add loading state to async buttons
<Button
  disabled={isLoading}
  onClick={handleAction}
>
  {isLoading ? <Loader className="animate-spin" /> : 'Submit'}
</Button>
```

---

### H2 — Match Between System and Real World

**What to Check:**
- [ ] User-friendly terminology (no jargon)
- [ ] Logical information hierarchy
- [ ] Familiar icons with correct meaning
- [ ] Culturally appropriate language

**Files to Inspect:**
```
src/app/(dashboard)/perks/page.tsx
src/components/perks/perk-card.tsx
src/components/perks/offer-card.tsx
src/components/layout/top-nav.tsx
```

**Audit Actions:**
```bash
# Find all user-facing text
grep -r "className=.*text-" src/components/ --include="*.tsx" | head -50

# Check for technical jargon in labels
grep -rE "(API|endpoint|fetch|query|mutation)" src/components/ --include="*.tsx"
```

**Expected Patterns:**
- "Perks" not "deals" or "offers" (per product language)
- "Redeem" not "activate" or "claim"
- Investment stages use founder-friendly terms
- Error messages are actionable, not technical

---

### H3 — User Control and Freedom

**What to Check:**
- [ ] Clear back navigation from detail views
- [ ] Cancel/close buttons on modals
- [ ] Undo capability for destructive actions
- [ ] Easy filter reset functionality
- [ ] Escape key closes modals/dropdowns

**Files to Inspect:**
```
src/app/(dashboard)/perks/[id]/page.tsx
src/components/ui/disclosure.tsx
src/components/perks/category-filter.tsx
```

**Audit Actions:**
```bash
# Check for back navigation
grep -r "useRouter\|router.back\|router.push" src/ --include="*.tsx"

# Check for escape key handlers
grep -r "Escape\|onKeyDown" src/ --include="*.tsx"

# Check for clear/reset functionality
grep -r "clear\|reset\|Clear\|Reset" src/components/ --include="*.tsx"
```

**Expected Patterns:**
- Detail pages have clear "Back to Perks" link
- All modals close on Escape and backdrop click
- Filter UI has "Clear all" option
- Confirmation before destructive admin actions

---

### H4 — Consistency and Standards

**What to Check:**
- [ ] Consistent button styles across app
- [ ] Uniform card layouts
- [ ] Predictable navigation patterns
- [ ] Consistent spacing (8px grid per DESIGN_SYSTEM.md)

**Files to Inspect:**
```
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/badge.tsx
DESIGN_SYSTEM.md
tailwind.config.js
```

**Audit Actions:**
```bash
# Check for spacing inconsistencies (non-8px values)
grep -rE "p-[1357]|m-[1357]|gap-[1357]|space-[xy]-[1357]" src/ --include="*.tsx"

# Check for inline styles (should use Tailwind)
grep -r "style={{" src/ --include="*.tsx"

# Check button variant consistency
grep -r "variant=" src/components/ --include="*.tsx"
```

**Expected Patterns:**
- All spacing uses 8px multiples (4px only for micro-spacing)
- Cards use consistent border-radius (`rounded-xl`)
- Buttons use variant system (primary/secondary/ghost)
- Icons are all from Lucide, line style only

---

### H5 — Error Prevention

**What to Check:**
- [ ] Confirmation dialogs for destructive actions
- [ ] Inline form validation
- [ ] Smart defaults on filters
- [ ] Disabled states for unavailable actions

**Files to Inspect:**
```
src/app/(dashboard)/admin/whitelist/page.tsx
src/app/(dashboard)/admin/individual-access/page.tsx
src/components/ui/input.tsx
```

**Audit Actions:**
```bash
# Check for confirmation dialogs
grep -r "confirm\|Confirm\|Dialog\|Modal" src/ --include="*.tsx"

# Check for form validation
grep -r "required\|validate\|error\|Error" src/components/ --include="*.tsx"

# Check for disabled states
grep -r "disabled" src/components/ --include="*.tsx"
```

**Expected Patterns:**
- Delete actions require confirmation
- Form inputs validate before submission
- Search has debouncing to prevent excessive requests
- Admin actions have role checks

---

### H6 — Recognition Over Recall

**What to Check:**
- [ ] Visible labels (not just icons)
- [ ] Breadcrumbs on nested pages
- [ ] Persistent filters across navigation
- [ ] Recently viewed perks (if applicable)

**Files to Inspect:**
```
src/app/(dashboard)/perks/[id]/page.tsx
src/app/(dashboard)/admin/vendors/[id]/page.tsx
src/components/layout/top-nav.tsx
```

**Audit Actions:**
```bash
# Check for breadcrumbs
grep -r "breadcrumb\|Breadcrumb" src/ --include="*.tsx"

# Check navigation structure
grep -r "Link\|href=" src/components/layout/ --include="*.tsx"

# Check for icon-only buttons (should have labels or aria-label)
grep -r "aria-label" src/components/ --include="*.tsx"
```

**Expected Patterns:**
- Icons have text labels or tooltip explanations
- Nested pages show navigation path
- Filter state persists in URL params
- Active section highlighted in navigation

---

### H7 — Flexibility and Efficiency of Use

**What to Check:**
- [ ] Keyboard shortcuts for power users
- [ ] Quick filters for common use cases
- [ ] Bulk actions for admin (if applicable)

**Files to Inspect:**
```
src/app/(dashboard)/perks/page.tsx
src/components/perks/category-filter.tsx
src/app/(dashboard)/admin/whitelist/page.tsx
```

**Audit Actions:**
```bash
# Check for keyboard handlers
grep -r "onKeyDown\|useHotkeys\|hotkey" src/ --include="*.tsx"

# Check for quick filter presets
grep -r "preset\|quick\|shortcut" src/ --include="*.tsx"
```

**Expected Patterns:**
- `/` focuses search (power user shortcut)
- Escape clears current selection
- Tab navigation works correctly
- Bulk upload available for admin domains

---

### H8 — Aesthetic and Minimalist Design

**What to Check:**
- [ ] No unnecessary decorative elements
- [ ] Clear visual hierarchy
- [ ] Appropriate information density
- [ ] Single primary CTA per view

**Files to Inspect:**
```
src/components/perks/perk-card.tsx
src/components/perks/offer-card.tsx
src/app/(dashboard)/perks/page.tsx
```

**Audit Actions:**
```bash
# Check for competing CTAs
grep -r 'variant="primary"' src/ --include="*.tsx" | wc -l

# Check for decorative elements
grep -r "decoration\|ornament\|gradient" src/ --include="*.tsx"
```

**Expected Patterns:**
- One primary button per visual section
- Cards show only essential information
- Whitespace used effectively for scanning
- No purely decorative gradients or shapes

---

### H9 — Help Users Recognize and Recover from Errors

**What to Check:**
- [ ] Clear, specific error messages
- [ ] Suggested resolution steps
- [ ] No technical error codes exposed to users

**Files to Inspect:**
```
src/app/api/**/route.ts
src/components/perks/perks-grid.tsx
src/lib/api/*.ts
```

**Audit Actions:**
```bash
# Check error handling in API routes
grep -r "catch\|error\|Error" src/app/api/ --include="*.ts"

# Check error display components
grep -r "error\|Error" src/components/ --include="*.tsx"

# Check for generic error messages
grep -r "went wrong\|Something went\|try again" src/ --include="*.tsx"
```

**Expected Patterns:**
- "Perk not found" not "404 NOT_FOUND"
- Errors include next steps: "Try refreshing or contact support"
- API errors are caught and translated to user-friendly messages
- Empty states guide users toward action

---

### H10 — Help and Documentation

**What to Check:**
- [ ] Tooltips for complex features
- [ ] Empty states with guidance
- [ ] Contextual help links
- [ ] Onboarding for first-time users

**Files to Inspect:**
```
src/components/perks/perks-grid.tsx (empty state)
src/app/(dashboard)/perks/page.tsx
```

**Audit Actions:**
```bash
# Check for tooltips
grep -r "tooltip\|Tooltip\|title=" src/components/ --include="*.tsx"

# Check for empty states
grep -r "empty\|Empty\|no results\|No results" src/ --include="*.tsx"

# Check for help links
grep -r "help\|support\|documentation" src/ --include="*.tsx"
```

**Expected Patterns:**
- Empty search results suggest alternative actions
- Filter pill hover explains filter criteria
- Admin features have helper text
- New users see onboarding guidance

---

## 2. Accessibility Audit (WCAG 2.1)

### 2.1 Perceivable

**Checks:**
- [ ] Color contrast meets 4.5:1 for normal text, 3:1 for large text
- [ ] Color is not sole indicator (icons/text supplement)
- [ ] Images have alt text
- [ ] Text resizable to 200%

**Audit Actions:**
```bash
# Check for alt text
grep -r "<img\|<Image" src/ --include="*.tsx" | grep -v "alt="

# Check for color-only indicators
grep -r "red\|green\|blue" src/components/ --include="*.tsx"

# Check for proper heading hierarchy
grep -rE "<h[1-6]" src/ --include="*.tsx"
```

**Focus Areas:**
- Vendor logo images need alt text
- Status badges need text, not just color
- Error states need icon + text, not just red color

---

### 2.2 Operable

**Checks:**
- [ ] All interactive elements keyboard accessible
- [ ] Touch targets minimum 44×44px on mobile
- [ ] No keyboard traps
- [ ] Focus visible on all elements

**Audit Actions:**
```bash
# Check for focus styles
grep -r "focus:" src/components/ --include="*.tsx"
grep -r "focus-visible" src/ --include="*.tsx"

# Check for tabIndex
grep -r "tabIndex\|tabindex" src/ --include="*.tsx"

# Check button/link touch targets
grep -r "h-8\|h-6\|w-8\|w-6" src/components/ui/ --include="*.tsx"
```

**Focus Areas:**
- Filter buttons should have visible focus ring
- Card actions should be keyboard navigable
- Modal should trap focus when open

---

### 2.3 Understandable

**Checks:**
- [ ] Form inputs have visible labels
- [ ] Error messages are clear
- [ ] Navigation is consistent
- [ ] Language is set on HTML

**Audit Actions:**
```bash
# Check for label association
grep -r "htmlFor\|aria-labelledby" src/ --include="*.tsx"

# Check for placeholder-only inputs (bad)
grep -r "placeholder=" src/components/ui/input.tsx
```

**Focus Areas:**
- Search input should have aria-label
- Form fields should have associated labels
- Filter dropdowns should announce selected value

---

### 2.4 Robust

**Checks:**
- [ ] Semantic HTML elements used
- [ ] ARIA attributes correct
- [ ] Works across browsers

**Audit Actions:**
```bash
# Check for semantic elements
grep -r "<nav\|<main\|<section\|<article\|<aside\|<header\|<footer" src/ --include="*.tsx"

# Check for div soup
grep -r "<div" src/components/ --include="*.tsx" | wc -l

# Check for ARIA
grep -r "aria-" src/ --include="*.tsx"
```

**Focus Areas:**
- Use `<nav>` for navigation
- Use `<main>` for main content area
- Use `<button>` for actions, `<a>` for navigation

---

## 3. Flow Analysis

### 3.1 Perk Discovery Flow

**User Journey:**
1. Land on perks page
2. Browse/search perks
3. Apply filters
4. View perk details
5. Redeem perk

**Friction Points to Check:**
- [ ] Clear entry point to perks
- [ ] Search is prominent and functional
- [ ] Filters are discoverable
- [ ] Perk cards have clear CTA
- [ ] Detail page has clear redemption path

**Files to Analyze:**
```
src/app/(dashboard)/page.tsx
src/app/(dashboard)/perks/page.tsx
src/app/(dashboard)/perks/[id]/page.tsx
src/components/perks/perk-card.tsx
```

---

### 3.2 Admin Management Flow

**User Journey:**
1. Access admin section
2. View vendors/whitelist
3. Make changes
4. Confirm actions

**Friction Points to Check:**
- [ ] Admin section clearly accessible
- [ ] Tables are scannable and sortable
- [ ] Actions have clear labels
- [ ] Destructive actions require confirmation

**Files to Analyze:**
```
src/app/(dashboard)/admin/page.tsx
src/app/(dashboard)/admin/vendors/page.tsx
src/app/(dashboard)/admin/whitelist/page.tsx
```

---

## 4. Common UX Issues Checklist

### Forms & Input
- [ ] No placeholder-only labels
- [ ] Inline validation on blur
- [ ] Clear required vs optional indication
- [ ] Password requirements shown upfront

### Navigation
- [ ] Current location visible in nav
- [ ] Consistent back button behavior
- [ ] No hamburger menu on desktop
- [ ] Breadcrumbs on deep pages

### Feedback
- [ ] Actions have visible response
- [ ] Specific error messages
- [ ] Loading states for async
- [ ] Toast notifications for actions

### Mobile
- [ ] Touch targets ≥44px
- [ ] No horizontal scroll
- [ ] Keyboard doesn't obscure input
- [ ] Filters accessible on mobile

---

## 5. Audit Output Format

When running this audit, document findings as:

```markdown
### Finding: [Short Title]

**Severity:** 🔴 Critical / 🟡 Major / 🔵 Minor

**Location:** `src/path/to/file.tsx:line`

**Issue:** [Description of the problem]

**Impact:** [User impact]

**Fix:** [Specific solution]

**Code Example:**
\`\`\`tsx
// Before
...
// After
...
\`\`\`
```

---

## 6. Priority Matrix

### Fix First (🔴 Critical)
- Blocks core tasks
- Causes data loss
- Accessibility failures (WCAG A)
- Broken navigation

### Fix Second (🟡 Major)
- Significant friction in common flows
- Confusing UI patterns
- Missing feedback states
- Accessibility issues (WCAG AA)

### Fix Third (🔵 Minor)
- Polish issues
- Inconsistencies
- Nice-to-have improvements
- Micro-interaction refinements

---

## 7. Post-Audit Actions

After completing the audit:

1. **Prioritize findings** by severity and impact
2. **Create tasks** for each finding
3. **Group related fixes** for efficient implementation
4. **Test fixes** against original issue
5. **Update documentation** if patterns change

---

**This audit is based on the ux-consultant skill framework.**
**Run this audit periodically to maintain UX quality.**
