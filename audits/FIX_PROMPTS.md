# Fix Prompts for Audit Findings

Use these prompts with Claude Code to fix each category of issues found in the audit.

---

## 1. Fix Border Radius Violations (~71 instances)

**Priority:** HIGH - Most visible issue affecting entire app

```
Fix all border radius violations in the perks-portal-v2 project according to DESIGN_SYSTEM.md.

Rules:
- Buttons, badges, pills, filter chips → `rounded-full`
- Cards, dropdowns, modals → `rounded-xl`
- Remove all `rounded-lg` and `rounded-md` from interactive elements

Files to fix:
1. src/components/ui/button.tsx - change rounded-lg to rounded-full
2. src/components/ui/badge.tsx - change rounded-md to rounded-full
3. src/components/perks/offer-card.tsx - badges should be rounded-full
4. src/components/perks/perk-card.tsx - badges should be rounded-full
5. src/components/vendors/vendor-card.tsx - badges should be rounded-full
6. src/app/(dashboard)/admin/vendors/[id]/page.tsx - ColorLabel should be rounded-full
7. src/components/ui/search-input.tsx - clear button should be rounded-full

After fixing, run this to verify no violations remain:
grep -rE "rounded-(lg|md)" src/components/ui/ src/components/perks/ --include="*.tsx"

Show me the changes before committing.
```

---

## 2. Fix Spacing Violations (11 instances)

**Priority:** HIGH - Violates core 8px grid system

```
Fix all non-8px spacing violations in perks-portal-v2 according to DESIGN_SYSTEM.md.

Rules:
- All spacing must be multiples of 8px (Tailwind: 2, 4, 6, 8, 10, 12, 16)
- 4px (p-1, gap-1) only allowed for icon-text spacing and badge internal padding
- p-3 (12px) → p-4 (16px)
- p-5 (20px) → p-4 (16px) or p-6 (24px)
- gap-3 (12px) → gap-4 (16px)
- gap-5 (20px) → gap-4 (16px) or gap-6 (24px)
- py-3.5 (14px) → py-4 (16px)

Files to fix:
1. src/app/(dashboard)/admin/vendors/[id]/page.tsx
   - gap-3 → gap-4
   - space-y-3 → space-y-4
   - py-5 → py-6 (or py-4 if tighter spacing needed)

2. src/components/layout/api-health-badge.tsx
   - p-3 → p-4

3. src/components/landing-page.tsx
   - gap-3 → gap-4
   - gap-5 → gap-6
   - py-3.5 → py-4

4. src/components/admin/redemptions-table.tsx
   - space-y-3 → space-y-4
   - py-3 → py-4

After fixing, verify with:
grep -rE "p-[35]|gap-[35]|space-[xy]-[35]|py-3\.5" src/ --include="*.tsx"

Show me the changes before committing.
```

---

## 3. Fix Text Size Violations (20+ instances)

**Priority:** MEDIUM - Visual consistency

```
Fix all non-standard text sizes in perks-portal-v2 according to DESIGN_SYSTEM.md.

Allowed text sizes:
- text-2xl (24px) - Page titles only
- text-xl (20px) - Section headers
- text-base (16px) - Subheadings
- text-[14px] - Primary body text
- text-[13px] - Secondary/meta text
- text-[12px] - Badges, pills, small labels
- text-xs (12px) - Same as text-[12px], either is acceptable

NOT allowed:
- text-[15px] → use text-[14px]
- text-[11px] → use text-[12px]
- text-[10px] → use text-[12px] or text-xs

Files to fix:
1. src/components/ui/card.tsx
   - text-[15px] → text-[14px]

2. src/components/ui/button.tsx
   - text-[15px] (lg variant) → text-[14px]

3. src/components/perks/offer-card.tsx
   - text-[15px] → text-[14px]

4. src/components/perks/perk-card.tsx
   - text-[15px] → text-[14px]

5. src/components/vendors/vendor-card.tsx
   - text-[15px] → text-[14px]
   - text-[11px] → text-[12px]

6. src/components/layout/bottom-nav.tsx
   - text-[10px] → text-[12px]

7. src/components/layout/api-health-badge.tsx
   - text-[11px] → text-[12px]
   - text-[10px] → text-[12px]

After fixing, verify with:
grep -rE "text-\[(10|11|15)px\]" src/ --include="*.tsx"

Show me the changes before committing.
```

---

## 4. Fix Error Handling Gaps (6 routes)

**Priority:** MEDIUM - Production reliability

```
Improve error handling in perks-portal-v2 API routes and client-side code.

Rules:
- Catch blocks should capture the error parameter
- Server-side errors should be logged with console.error
- Client-side silent catches should at least log in development

Files to fix:

1. src/app/api/health/route.ts
   Change empty catches to capture error:
   } catch (error) {
     console.error('Database health check failed:', error)
   }

2. src/app/api/auth/login/route.ts
   Add error logging to catch block:
   } catch (error) {
     console.error('Login failed:', error)
     // existing error response
   }

3. src/app/(dashboard)/perks/perks-content.tsx
   Change silent catch to:
   .catch((error) => {
     if (process.env.NODE_ENV === 'development') {
       console.error('Offer sync failed:', error)
     }
   })

4. src/app/(dashboard)/admin/vendors/page.tsx
   Change silent catch to:
   .catch((error) => {
     if (process.env.NODE_ENV === 'development') {
       console.error('Vendor sync failed:', error)
     }
   })

Show me the changes before committing.
```

---

## 5. Clean Up Console Statements (36 instances)

**Priority:** LOW - Code hygiene

```
Review and clean up console statements in perks-portal-v2.

Rules:
- Server-side console.error in API routes: KEEP (needed for logging)
- Client-side console.error for actual errors: KEEP
- Client-side console.log for debugging: REMOVE
- console.warn: Review case by case

Run this to find all console statements:
grep -rn "console\." src/ --include="*.tsx" --include="*.ts"

For each console statement:
1. If it's in src/app/api/ → KEEP (server logging)
2. If it's console.error for a caught error → KEEP
3. If it's console.log → REMOVE
4. If it's console.warn → Review and decide

Show me what you plan to remove before making changes.
```

---

## 6. Fix Badge Color Tokens (1 file)

**Priority:** LOW - Minor visual consistency

```
Update badge color tokens in perks-portal-v2 to use Bridge Blue instead of Tailwind indigo.

File: src/components/ui/badge.tsx

Current (using Tailwind indigo):
- bg-indigo-50 text-indigo-700

Change to Bridge Blue tokens:
- bg-[#0038FF]/10 text-[#0038FF]

Or if a softer variant is needed:
- bg-[#0038FF]/5 text-[#0038FF]

Read DESIGN_SYSTEM.md for the official Bridge Blue color values before making changes.

Show me the changes before committing.
```

---

## All-in-One Fix (Run after individual fixes or instead of)

```
Verify all audit findings have been fixed in perks-portal-v2.

Run these verification commands:

# Border radius - should return no results
grep -rE "rounded-(lg|md)" src/components/ui/ src/components/perks/ --include="*.tsx"

# Spacing - should return no results (except intentional p-1/gap-1 for icons)
grep -rE "p-[35]|gap-[35]|space-[xy]-[35]|py-3\.5" src/ --include="*.tsx"

# Text sizes - should return no results
grep -rE "text-\[(10|11|15)px\]" src/ --include="*.tsx"

# TypeScript check
npm run type-check

# Lint check
npm run lint

Report the results of each verification command.
```

---

## Commit Message Templates

After fixing each category, use these commit messages:

```bash
# Border radius
git commit -m "fix(ui): standardize border radius per design system

- Buttons, badges, pills → rounded-full
- Cards, dropdowns → rounded-xl
- Remove rounded-lg/md from interactive elements"

# Spacing
git commit -m "fix(ui): enforce 8px grid spacing system

- Replace p-3/p-5 with p-4/p-6
- Replace gap-3/gap-5 with gap-4/gap-6
- All spacing now multiples of 8px"

# Text sizes
git commit -m "fix(ui): standardize text sizes per design system

- text-[15px] → text-[14px]
- text-[11px] → text-[12px]
- text-[10px] → text-[12px]"

# Error handling
git commit -m "fix(api): improve error handling and logging

- Add error parameter to catch blocks
- Add development logging for silent catches
- Ensure all errors are properly logged"

# Console cleanup
git commit -m "chore: remove debug console statements

- Keep server-side error logging
- Remove client-side debug logs"

# Badge colors
git commit -m "fix(ui): align badge colors with Bridge Blue tokens

- Replace Tailwind indigo with Bridge Blue #0038FF"
```
