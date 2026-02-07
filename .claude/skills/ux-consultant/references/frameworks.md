# UX Evaluation Frameworks

## Table of Contents

1. Nielsen's 10 Usability Heuristics
2. WCAG Accessibility Quick-Check
3. Cognitive Load Principles
4. Platform Conventions
5. Common UX Patterns to Watch For

---

## 1. Nielsen's 10 Usability Heuristics

Apply these as the primary evaluation lens for any design review.

**H1 — Visibility of System Status**
Does the system inform users about what's happening through timely, appropriate feedback? Check for: loading indicators, progress bars, success/error states, selection highlights, active navigation states.

**H2 — Match Between System and Real World**
Does the system use language, concepts, and conventions familiar to the user? Check for: jargon-free labels, logical information order, familiar icons, culturally appropriate metaphors.

**H3 — User Control and Freedom**
Can users easily undo, redo, or exit unwanted states? Check for: undo actions, cancel buttons, back navigation, exit points from flows, draft saving.

**H4 — Consistency and Standards**
Does the design follow platform conventions and its own internal patterns? Check for: consistent button styles, predictable navigation, uniform terminology, matching interaction patterns across similar elements.

**H5 — Error Prevention**
Does the design prevent errors before they occur? Check for: confirmation dialogs for destructive actions, inline validation, smart defaults, constraints on input, disabled states for unavailable actions.

**H6 — Recognition Over Recall**
Are options, actions, and information visible rather than requiring memory? Check for: visible labels (not just icons), breadcrumbs, persistent navigation, recently used items, contextual help.

**H7 — Flexibility and Efficiency of Use**
Does the design accommodate both novice and expert users? Check for: keyboard shortcuts, customization options, shortcuts for frequent actions, progressive disclosure.

**H8 — Aesthetic and Minimalist Design**
Does every element serve a purpose? Check for: visual clutter, competing calls-to-action, unnecessary decorative elements, information density appropriate to context.

**H9 — Help Users Recognize, Diagnose, and Recover from Errors**
Are error messages clear, specific, and constructive? Check for: plain-language error messages, specific problem identification, suggested resolution steps, no error codes without explanation.

**H10 — Help and Documentation**
Is help available and easy to find when needed? Check for: tooltips, onboarding flows, contextual help links, searchable documentation, empty states with guidance.

---

## 2. WCAG Accessibility Quick-Check

Use this as a supplemental lens, especially when reviewing visual design or interactive elements.

**Perceivable**
- Color contrast: minimum 4.5:1 for normal text, 3:1 for large text (18px+ bold or 24px+ regular)
- Color is not the sole means of conveying information (icons, patterns, labels supplement color)
- Images have alt text; decorative images are hidden from screen readers
- Text is resizable up to 200% without loss of content

**Operable**
- All interactive elements are keyboard accessible (tab order, focus indicators)
- Touch targets are minimum 44×44px (mobile) or 24×24px (web with spacing)
- No content that flashes more than 3 times per second
- Users can pause, stop, or hide moving/auto-updating content

**Understandable**
- Labels are visible and associated with form controls
- Error identification is clear and programmatically determinable
- Navigation is consistent across pages
- Language of the page is set correctly

**Robust**
- Semantic HTML used appropriately (headings, landmarks, lists)
- ARIA attributes used correctly when needed
- Content works across browsers and assistive technologies

---

## 3. Cognitive Load Principles

Apply when evaluating information density, task complexity, or user overwhelm.

**Miller's Law** — Working memory holds ~7±2 items. Chunk information and limit choices per screen. If a form has 15+ fields, consider progressive disclosure or multi-step.

**Hick's Law** — Decision time increases with the number of options. Reduce visible choices, use smart defaults, and prioritize the most common action.

**Fitts's Law** — Time to reach a target depends on distance and size. Primary actions should be large and easily reachable. On mobile, place key actions in thumb zones.

**Von Restorff Effect** — Distinct items are remembered better. Use visual emphasis (color, size, position) for the single most important action per screen.

**Cognitive Tunneling** — Under stress or task focus, users miss peripheral information. Place critical feedback and errors near the user's current focus point.

**Progressive Disclosure** — Show only what's needed at each step. Hide advanced options behind expandable sections, "More options" links, or secondary screens.

**Gestalt Principles** — Related items should be visually grouped (proximity, similarity, enclosure). Ensure visual grouping matches logical grouping.

---

## 4. Platform Conventions

Reference when evaluating platform-specific designs.

**iOS (Human Interface Guidelines)**
- Navigation: tab bar (bottom) for top-level, nav bar (top) for hierarchy
- Modals: sheet presentation (partial screen) preferred over full-screen for non-blocking tasks
- Actions: swipe gestures for contextual actions, long-press for secondary options
- Typography: SF Pro, Dynamic Type support expected

**Android (Material Design)**
- Navigation: bottom navigation bar, navigation drawer for complex apps
- Actions: FAB (floating action button) for primary action, bottom sheets for secondary
- Feedback: snackbars for brief messages, dialogs for required decisions
- Typography: Roboto, support for user font size preferences

**Web (Common Conventions)**
- Navigation: top horizontal bar or left sidebar, logo links to home
- Forms: labels above inputs, inline validation, clear submit/cancel actions
- Tables: sortable columns, pagination or infinite scroll, bulk actions
- Feedback: toast notifications, inline alerts, modal confirmations for destructive actions

---

## 5. Common UX Patterns to Watch For

These are frequently seen issues to flag proactively during reviews.

**Onboarding & First-Use**
- Empty states that don't guide the user toward first action
- Too many permissions requested upfront
- Onboarding that can't be skipped or revisited

**Forms & Input**
- Labels that disappear (placeholder-only labels)
- No inline validation — errors only shown on submit
- No indication of required vs optional fields
- Password requirements revealed only after failed submission

**Navigation & Wayfinding**
- No indication of current location in navigation
- Hamburger menus hiding critical navigation on desktop
- Inconsistent back button behavior
- Deep nesting without breadcrumbs

**Feedback & Communication**
- Actions with no visible response (silent success/failure)
- Generic error messages ("Something went wrong")
- No loading states for async operations
- Modals or alerts interrupting flow unnecessarily

**Mobile-Specific**
- Touch targets too small or too close together
- Content hidden behind horizontal scrolls without indication
- Fixed elements blocking content on small screens
- Input fields obscured by keyboard without auto-scroll

**Visual & Hierarchy**
- Multiple competing CTAs with equal visual weight
- Important information below the fold without scroll cues
- Low contrast text on images or colored backgrounds
- Inconsistent spacing, alignment, or component styles
