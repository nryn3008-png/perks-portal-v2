# Motion Patterns

Standard animation timing, easing curves, and interaction patterns. Match to design specs when provided — use these as sensible defaults when motion isn't specified.

## Table of Contents

1. Timing and Easing Defaults
2. Micro-Interactions
3. Page Transitions
4. Loading and Feedback
5. Scroll Animations
6. Framer Motion Patterns

---

## 1. Timing and Easing Defaults

### Duration Scale

| Token          | Duration | Use Case                                          |
|----------------|----------|---------------------------------------------------|
| duration-75    | 75ms     | Instant feedback: opacity toggle, color swap       |
| duration-150   | 150ms    | Micro-interactions: button hover, focus ring, toggle |
| duration-200   | 200ms    | Small transitions: dropdown open, tooltip appear    |
| duration-300   | 300ms    | Medium transitions: modal enter, sidebar slide      |
| duration-500   | 500ms    | Large transitions: page transition, accordion expand |
| duration-700   | 700ms    | Dramatic: hero animations, onboarding sequences     |
| duration-1000  | 1000ms   | Maximum for UI animations — anything longer feels sluggish |

### Easing Curves

**ease-out** (decelerate) — Default for elements entering the screen. Fast start, gentle finish. `cubic-bezier(0, 0, 0.2, 1)`

**ease-in** (accelerate) — For elements leaving the screen. Gentle start, fast exit. `cubic-bezier(0.4, 0, 1, 1)`

**ease-in-out** — For elements that stay on screen and change (resizing, repositioning). `cubic-bezier(0.4, 0, 0.2, 1)`

**spring** (Framer Motion) — Natural, bouncy feel for interactive elements. `type: "spring", stiffness: 300, damping: 25`

### The Golden Rule

Enter: **ease-out, slightly longer** (200–300ms)
Exit: **ease-in, slightly shorter** (150–200ms)

Users should barely notice animations — they should just make the interface feel smooth and responsive.

---

## 2. Micro-Interactions

### Button States

```css
/* Hover */
transition: all 150ms ease;
/* Scale up slightly for prominent buttons: */
transform: translateY(-1px); /* subtle lift */
/* Or just color change — don't over-animate buttons */

/* Active/pressed */
transform: scale(0.98); /* subtle press */
transition: transform 75ms ease;

/* Loading state */
/* Replace label with spinner, maintain button width */
/* Or show spinner alongside label */
```

### Toggle / Switch

```css
/* Track and thumb transition */
transition: background-color 200ms ease, transform 200ms ease;
/* Thumb slides: translateX(0) → translateX(20px) */
/* Track color: gray-200 → primary-600 */
```

### Hover Cards / Tooltips

```
Appear: opacity 0→1 + translateY(4px→0), 200ms ease-out
Delay before showing: 200-400ms (prevents flicker)
Disappear: opacity 1→0, 150ms ease-in
Delay before hiding: 100ms (prevents accidental dismiss)
```

### Dropdown / Select Menu

```
Open: opacity 0→1 + scaleY(0.95→1) from top, 200ms ease-out
Close: opacity 1→0 + scaleY(1→0.95), 150ms ease-in
Transform origin: top center
Items: stagger each 25ms for max 5 items, then batch
```

### Focus Ring

```css
/* Use outline, not box-shadow, for proper accessibility */
outline: 2px solid var(--color-primary-500);
outline-offset: 2px;
transition: outline-offset 150ms ease;
/* Only show on keyboard focus: */
:focus-visible { /* apply styles */ }
:focus:not(:focus-visible) { outline: none; }
```

---

## 3. Page Transitions

### Route Change (SPA)

```
Exiting page: opacity 1→0, 150ms ease-in
Entering page: opacity 0→1 + translateY(8px→0), 200ms ease-out
```

### Shared Layout Transitions

When an element persists across views (e.g., a card expanding to a detail page):
- Use `layoutId` in Framer Motion for automatic interpolation
- Duration: 300ms with spring easing
- Other elements fade out/in around the shared element

### Tab / Panel Switch

```
Exiting panel: opacity 1→0, 150ms ease-in
Entering panel: opacity 0→1, 200ms ease-out
Direction-aware: slide left/right based on tab index change (optional, adds polish)
```

---

## 4. Loading and Feedback

### Skeleton Screen

```css
/* Pulse animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
animation: pulse 2s ease-in-out infinite;
```

### Spinner

```css
/* Simple rotation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
animation: spin 0.8s linear infinite;
/* Use a circle with a gap (border-transparent on one side) */
/* Size: match context — 16px inline, 20px buttons, 32px page-level */
```

### Progress Bar

```css
/* Smooth width transition */
transition: width 300ms ease-in-out;
/* Indeterminate: sliding gradient animation */
@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Success / Error Feedback

```
Success check: scale 0→1.1→1, 300ms spring, with a brief delay after action
Error shake: translateX 0→-4→4→-4→4→0, 400ms, ease-in-out
Toast slide-in: translateX(100%→0) + opacity 0→1, 300ms ease-out
```

---

## 5. Scroll Animations

### Fade In On Scroll (Intersection Observer)

```
Initial: opacity 0, translateY(20px)
Animate to: opacity 1, translateY(0)
Duration: 500ms ease-out
Trigger: when element is 20% visible
Run once: don't re-animate on scroll up
```

### Staggered List Items

```
Each item delays by 50-75ms after the previous
Max stagger: 5-8 items, then batch the rest
Same animation per item: opacity 0→1 + translateY(10px→0)
Duration: 300ms ease-out per item
```

### Parallax (use sparingly)

```
Background moves at 0.3-0.5x scroll speed relative to content
Keep it subtle — heavy parallax feels dated
Only use for hero sections or marketing pages
Never use in app interfaces
```

---

## 6. Framer Motion Patterns

### Basic Enter/Exit

```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
/>
```

### Staggered Children

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => <motion.li key={i} variants={item} />)}
</motion.ul>
```

### Layout Animation

```tsx
// Smooth reordering, resizing, repositioning
<motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} />

// Shared element across views
<motion.div layoutId="shared-card" />
```

### Gesture Interactions

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
/>
```

### AnimatePresence for Exit Animations

```tsx
// Wrap conditional elements to animate them out
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="unique"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  )}
</AnimatePresence>
```
