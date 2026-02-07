# Component Patterns

Reusable implementation patterns for common UI components. All examples use React + Tailwind + TypeScript. Adapt to the user's stack as needed.

## Table of Contents

1. Button
2. Input Field
3. Card
4. Modal / Dialog
5. Navigation
6. Table
7. Toast / Notification
8. Form Pattern
9. Empty State
10. Loading Skeleton

---

## 1. Button

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}

// Sizing reference (match to design tokens):
// sm: h-8 px-3 text-sm gap-1.5
// md: h-10 px-4 text-sm gap-2
// lg: h-12 px-6 text-base gap-2

// Variant colors (replace with design system tokens):
// primary: bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800
// secondary: bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300
// ghost: bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200
// destructive: bg-error-600 text-white hover:bg-error-700 active:bg-error-800

// Always include:
// - focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
// - disabled:opacity-50 disabled:pointer-events-none
// - transition-colors duration-150
// - rounded-md (or design system radius)
// - inline-flex items-center justify-center font-medium
```

## 2. Input Field

```tsx
interface InputProps {
  label: string
  placeholder?: string
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  type?: 'text' | 'email' | 'password' | 'number' | 'search'
}

// Structure:
// <div> (field wrapper, gap-1.5 flex flex-col)
//   <label> (text-sm font-medium text-gray-700)
//   <input> (h-10 px-3 rounded-md border border-gray-300 text-base)
//   <p> (helper or error text, text-sm text-gray-500 or text-error-600)

// States:
// Default: border-gray-300 bg-white
// Focus: border-primary-500 ring-1 ring-primary-500 (outline-none)
// Error: border-error-500 ring-1 ring-error-500
// Disabled: bg-gray-50 text-gray-400 cursor-not-allowed

// Never use placeholder as label substitute
// Always associate label with htmlFor matching input id
// Always show error message below input, not as tooltip
```

## 3. Card

```tsx
// Structure:
// <div> (rounded-lg border border-gray-200 bg-white shadow-sm)
//   <div> (p-5 or p-6 — card body)
//     content
//   <div> (px-5 py-3 border-t border-gray-100 bg-gray-50 — card footer, optional)

// Variants:
// Default: border border-gray-200 shadow-sm
// Elevated: border-0 shadow-md
// Interactive: + hover:shadow-md hover:border-gray-300 transition-shadow cursor-pointer
// Selected: border-primary-500 ring-1 ring-primary-500 bg-primary-50

// Inner spacing should be consistent — if card padding is 20px,
// don't use different padding for different cards on the same page
```

## 4. Modal / Dialog

```tsx
// Structure:
// Backdrop: fixed inset-0 bg-black/50 z-50 (flex items-center justify-center)
// Panel: bg-white rounded-xl shadow-xl max-w-md w-full mx-4
//   Header: px-6 pt-6 pb-0 (title + optional close button)
//   Body: px-6 py-4
//   Footer: px-6 pb-6 pt-0 flex gap-3 justify-end

// Critical requirements:
// - Trap focus inside modal (use a focus trap library or dialog element)
// - Close on Escape key
// - Close on backdrop click (unless destructive action)
// - Prevent body scroll when open (overflow: hidden on body)
// - Animate in: opacity 0→1 + scale 0.95→1 (duration-200 ease-out)
// - Animate out: opacity 1→0 + scale 1→0.95 (duration-150 ease-in)
// - Use <dialog> element or role="dialog" aria-modal="true"
// - Return focus to trigger element on close
```

## 5. Navigation

```tsx
// Top nav structure:
// <nav> (h-16 border-b border-gray-200 bg-white px-4 lg:px-8)
//   <div> (max-w-screen-xl mx-auto h-full flex items-center justify-between)
//     Logo (left)
//     Nav items (center or left-of-center, flex gap-1)
//     Actions (right — user menu, CTA)

// Nav item:
// <a> or <button> (px-3 py-2 rounded-md text-sm font-medium)
// Default: text-gray-600 hover:text-gray-900 hover:bg-gray-100
// Active: text-gray-900 bg-gray-100 (or primary color underline/indicator)

// Sidebar structure:
// <aside> (w-64 border-r border-gray-200 bg-white h-screen flex flex-col)
//   Logo section (h-16 px-4 border-b flex items-center)
//   Nav section (flex-1 py-4 px-3 overflow-y-auto)
//   Footer section (border-t px-4 py-3 — user info, settings)

// Sidebar nav item:
// <a> (flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium)
// Default: text-gray-600 hover:bg-gray-100 hover:text-gray-900
// Active: bg-primary-50 text-primary-700 (or bg-gray-100 text-gray-900)
// Icon: 20px, same color as text, line/outline style
```

## 6. Table

```tsx
// Structure:
// <div> (overflow-x-auto rounded-lg border border-gray-200)
//   <table> (w-full text-sm)
//     <thead> (bg-gray-50 border-b border-gray-200)
//       <tr>
//         <th> (px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider)
//     <tbody> (divide-y divide-gray-100)
//       <tr> (hover:bg-gray-50 transition-colors)
//         <td> (px-4 py-3 text-gray-900)

// Key patterns:
// - Sticky header on scroll: thead with sticky top-0 bg-gray-50 z-10
// - Right-align numbers and currency
// - Actions column: right-aligned, use icon buttons (ghost variant)
// - Sort indicators: chevron-up/down icon next to sortable headers
// - Empty state: single row spanning all columns, centered message

// Mobile: either scroll horizontally with shadow indicators,
// or convert to card layout (each row becomes a card)
```

## 7. Toast / Notification

```tsx
// Position: fixed bottom-4 right-4 z-50 (or top-4 right-4)
// Container: flex gap-3 items-start p-4 rounded-lg shadow-lg border
// Variants:
//   Default: bg-white border-gray-200
//   Success: bg-white border-l-4 border-l-success-500
//   Error: bg-white border-l-4 border-l-error-500
//   Warning: bg-white border-l-4 border-l-warning-500

// Anatomy: icon (20px) + content (title bold + description) + close button
// Auto-dismiss: 5 seconds default, pause on hover
// Animation: slide in from right (translateX 100% → 0) + fade in
// Stack multiple: flex flex-col gap-2, newest on top or bottom
// Max width: 400px
```

## 8. Form Pattern

```tsx
// Single column form (most common):
// <form> (flex flex-col gap-5 max-w-lg)
//   <fieldset> (flex flex-col gap-5 — group related fields)
//     <legend> (text-lg font-semibold text-gray-900 mb-1)
//     Input fields (use Input component pattern above)
//   <div> (flex gap-3 justify-end pt-4 border-t — action bar)
//     Cancel button (secondary variant)
//     Submit button (primary variant)

// Two-column fields (only for tightly coupled pairs):
// <div> (grid grid-cols-2 gap-4)
//   First name input
//   Last name input

// Validation:
// - Validate on blur (not on every keystroke)
// - Show error message below the field immediately
// - Clear error when user starts fixing it (on change)
// - Disable submit button only when form is submitting (not for validation)
// - Show inline errors, not a summary at the top (unless also needed for accessibility)
```

## 9. Empty State

```tsx
// Structure:
// <div> (flex flex-col items-center justify-center py-16 px-4 text-center)
//   Icon (48px, text-gray-300, line style)
//   Title (text-base font-medium text-gray-900 mt-4)
//   Description (text-sm text-gray-500 mt-1 max-w-sm)
//   Action button (mt-4, primary or secondary variant)

// Keep it minimal — don't over-illustrate
// The action should be the obvious next step ("Create your first project")
// Match the tone to the product (casual vs professional)
```

## 10. Loading Skeleton

```tsx
// Skeleton block:
// <div> (animate-pulse bg-gray-200 rounded-md)
// Match the shape and size of the content it replaces

// Pattern: replicate the actual layout structure with gray blocks
// Text line: h-4 rounded-md bg-gray-200 (vary widths: w-3/4, w-1/2, w-full)
// Avatar: w-10 h-10 rounded-full bg-gray-200
// Image: aspect-video rounded-lg bg-gray-200
// Button: h-10 w-24 rounded-md bg-gray-200

// Animation: animate-pulse (opacity cycles 1 → 0.5 → 1, 2s duration)
// Always match the layout exactly so there's no shift when content loads
```
