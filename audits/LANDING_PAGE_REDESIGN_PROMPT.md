# Landing Page Redesign Prompt (With Skills & Animations)

Copy and paste this prompt into Claude Code:

---

```
Redesign the landing page at src/components/landing-page.tsx using the skills and design system, with smooth animations.

## Step 1: Read These Files First (MANDATORY)

Read all of these before writing any code:
1. DESIGN_SYSTEM.md (project root)
2. skills/ui-designer.skill (extract and read SKILL.md inside)
3. skills/frontend-developer.skill (extract and read SKILL.md inside)
4. skills/ux-consultant.skill (extract and read SKILL.md inside)

The .skill files are zip archives. Extract them to read the SKILL.md files inside.

## Step 2: Design Direction

**Style:** Minimal & clean (Linear, Vercel, Stripe aesthetic)
- Bold typography with generous whitespace
- Subtle depth through shadows, not heavy colors
- Confident, modern, never generic
- Smooth, purposeful animations throughout

## Step 3: Required Sections

1. **Hero Section**
   - Animated badge/pill at top with subtle fade-in
   - Bold headline (text-4xl sm:text-6xl) with staggered word animation
   - Bridge Blue accent on key phrase
   - Subheadline with fade-in delay
   - Primary CTA with hover scale + shadow animation
   - Subtle floating/pulse animation on decorative elements

2. **Stats Bar**
   - 3 metrics with count-up animation on scroll: 200+ perks, $2M+ saved, 50+ partners
   - Icons with subtle bounce on appear
   - Staggered reveal as user scrolls

3. **Partner Logos**
   - Infinite horizontal scroll/marquee animation
   - Logos: AWS, Notion, Figma, Linear, Vercel, Stripe, HubSpot, Slack, Intercom, Segment
   - Subtle opacity change on hover

4. **Categories Grid**
   - Cards with staggered fade-in on scroll
   - Hover: lift + shadow + icon color change
   - 2x3 grid with smooth transitions

5. **Benefits Section**
   - 3 cards with staggered slide-up animation
   - Icon containers with subtle pulse on hover
   - Smooth border/shadow transitions

6. **How It Works**
   - 3 steps with sequential reveal animation
   - Connecting line that draws between steps
   - Numbers with scale-in animation

7. **Final CTA**
   - Background gradient with subtle animated shift
   - Text fade-in with delay
   - Button with glow pulse animation

8. **Footer**
   - Simple fade-in

## Step 4: Animation Specifications

**Entrance Animations (on scroll/load):**
- fade-in: opacity 0→1, duration 600ms, ease-out
- slide-up: translateY(20px)→0 + fade-in, duration 500ms
- scale-in: scale(0.95)→1 + fade-in, duration 400ms
- stagger: 100-150ms delay between siblings

**Hover Animations:**
- Cards: translateY(-4px) + shadow increase, duration 200ms
- Buttons: scale(1.02) + shadow glow, duration 150ms
- Icons: color transition, duration 150ms

**Continuous Animations:**
- Marquee: infinite horizontal scroll, 30s duration, linear
- Subtle pulse: scale 1→1.05→1, 2s duration, infinite (use sparingly)
- Gradient shift: background-position animation, 8s duration

**Implementation:**
- Use CSS animations via Tailwind (animate-*) or inline keyframes
- Use Intersection Observer for scroll-triggered animations
- Add will-change for performance on animated elements
- Respect prefers-reduced-motion media query

## Step 5: Design System Compliance (STRICT)

**Colors:**
- Primary: #0038FF (Bridge Blue)
- Opacity variants: #0038FF/10, #0038FF/20, #0038FF/40
- Text: gray-900, gray-500, gray-400
- Backgrounds: white, gray-50, gray-900

**Spacing (8px grid ONLY):**
- Allowed: p-2, p-4, p-6, p-8, p-12, p-16, p-24
- FORBIDDEN: p-3, p-5, gap-3, gap-5, py-3.5

**Border Radius:**
- Buttons/badges/pills: rounded-full
- Cards/containers: rounded-xl or rounded-2xl
- NEVER: rounded-lg, rounded-md on interactive elements

**Typography:**
- Headlines: text-2xl, text-4xl, text-6xl
- Body: text-[14px]
- Secondary: text-[13px]
- Small: text-[12px]
- FORBIDDEN: text-[15px], text-[11px], text-[10px]

**Icons:** Lucide React, line style, h-4/h-5

## Step 6: Technical Requirements

- Keep 'use client' directive
- Keep useEffect for auth visibility change
- Keep BRIDGE_LOGIN_URL constant
- Use Next.js Image for logos
- Add custom CSS keyframes in a style tag or globals.css
- Use useEffect + IntersectionObserver for scroll animations
- Add useState to track animation states
- Support prefers-reduced-motion

## Step 7: CSS Animations to Add

Add these to globals.css or as inline styles:

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 56, 255, 0.4); }
  50% { box-shadow: 0 0 20px 4px rgba(0, 56, 255, 0.2); }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
.animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
.animate-scale-in { animation: scale-in 0.4s ease-out forwards; }
.animate-marquee { animation: marquee 30s linear infinite; }
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Step 8: Verification

After implementation, run:

```bash
# Should return NO results:
grep -E "p-[1357]|gap-[1357]" src/components/landing-page.tsx
grep -E "rounded-(lg|md)" src/components/landing-page.tsx
grep -E "text-\[(10|11|15)px\]" src/components/landing-page.tsx

# Should pass:
npm run type-check
```

## What to Avoid

- Janky or stuttering animations
- Too many competing animations
- Animations that block interaction
- Non-8px spacing
- Generic AI aesthetic
- Filled/emoji-style icons

Show me the complete redesigned component with all animations.
```

---

## Shorter Version

```
Redesign src/components/landing-page.tsx with smooth animations.

**Read first:** DESIGN_SYSTEM.md, skills/ui-designer.skill, skills/frontend-developer.skill (extract SKILL.md from each)

**Style:** Minimal, clean (Linear/Vercel), with purposeful animations

**Sections with animations:**
1. Hero - staggered text fade-in, CTA with hover glow
2. Stats - count-up animation, staggered reveal on scroll
3. Partners - infinite marquee scroll
4. Categories - cards with staggered fade-in, hover lift
5. Benefits - slide-up on scroll, icon pulse on hover
6. How it works - sequential step reveal, connecting line animation
7. Final CTA - gradient shift background, button glow pulse
8. Footer - simple fade-in

**Animation specs:**
- Entrance: fade-in 600ms, slide-up 500ms, stagger 100-150ms
- Hover: translateY(-4px), scale(1.02), duration 150-200ms
- Continuous: marquee 30s, pulse 2s (sparingly)
- Use IntersectionObserver for scroll triggers
- Respect prefers-reduced-motion

**Design system:** #0038FF, 8px grid (p-4/p-6/p-8), rounded-full buttons, rounded-xl cards, text-[14px]/[13px]/[12px], Lucide icons

Add CSS keyframes to globals.css. Show complete component.
```
