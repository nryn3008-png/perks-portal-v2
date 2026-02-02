# Prompt for Claude Code to Run Audits

Copy and paste the appropriate prompt below into Claude Code to run the audits.

---

## Option 1: Full Comprehensive Audit (Recommended)

```
Run a comprehensive audit of the perks-portal-v2 project using the audit guides in the /audits folder.

Follow this process:

1. **Read all audit documents first:**
   - audits/BACKEND_AUDIT.md
   - audits/FRONTEND_AUDIT.md
   - audits/UI_AUDIT.md
   - audits/UX_AUDIT.md
   - DESIGN_SYSTEM.md (for reference)

2. **Execute each audit in order of priority:**
   - Backend (security first)
   - Frontend (code quality)
   - UI (visual consistency)
   - UX (user experience)

3. **For each audit section:**
   - Run the bash/grep commands provided
   - Inspect flagged files
   - Document findings using the format specified
   - Note the severity (🔴 Critical, 🟡 Major, 🔵 Minor)

4. **Create a findings report** at `audits/AUDIT_FINDINGS.md` with:
   - Summary of issues by severity
   - Detailed findings organized by audit type
   - Recommended fix priority

5. **Fix the critical (🔴) issues** immediately, asking for confirmation before making changes.

6. **For major (🟡) issues**, list them but ask before fixing.

Start with reading the audit documents and then systematically work through each one.
```

---

## Option 2: Backend Security Audit Only

```
Run the backend security audit on the perks-portal-v2 project.

1. Read audits/BACKEND_AUDIT.md completely

2. Execute these security checks:
   - Input validation (look for missing Zod schemas)
   - Authentication checks on protected routes
   - SQL injection prevention
   - Hardcoded secrets
   - Environment variable validation

3. Run the grep commands in the audit document to find issues

4. Document all findings in audits/BACKEND_FINDINGS.md

5. Fix any critical (🔴) security issues immediately

Focus only on the backend API routes in src/app/api/
```

---

## Option 3: Frontend Code Quality Audit Only

```
Run the frontend code quality audit on the perks-portal-v2 project.

1. Read audits/FRONTEND_AUDIT.md completely

2. Execute these checks:
   - Run `npm run type-check` and fix any TypeScript errors
   - Search for `any` types and fix them
   - Check for accessibility issues (missing alt text, aria labels)
   - Verify semantic HTML usage
   - Check for inline styles (should use Tailwind)

3. Run the grep commands provided in the audit

4. Document findings in audits/FRONTEND_FINDINGS.md

5. Fix TypeScript errors and critical accessibility issues

Focus on src/components/ and src/app/ directories.
```

---

## Option 4: UI Design System Audit Only

```
Run the UI design system audit on the perks-portal-v2 project.

1. Read audits/UI_AUDIT.md and DESIGN_SYSTEM.md

2. Check for design system violations:
   - Color: Find non-Bridge Blue (#0038FF) blue colors
   - Spacing: Find non-8px grid values (p-3, p-5, gap-3, etc.)
   - Typography: Verify font sizes match spec
   - Border radius: Buttons should be rounded-full, cards rounded-xl
   - Components: Check button, card, badge, search styling

3. Run the grep commands to find violations

4. Document findings in audits/UI_FINDINGS.md

5. Fix spacing violations (most common issue)

Focus on src/components/ui/ and src/components/perks/
```

---

## Option 5: UX Heuristics Audit Only

```
Run the UX heuristics audit on the perks-portal-v2 project.

1. Read audits/UX_AUDIT.md completely

2. Evaluate against Nielsen's 10 heuristics:
   - H1: Check for loading states on all async operations
   - H3: Verify back navigation and escape handlers
   - H4: Check for consistency in patterns
   - H5: Look for error prevention (confirmations, validation)
   - H9: Verify error messages are helpful

3. Check accessibility (WCAG):
   - Keyboard navigation
   - Focus states
   - Screen reader support

4. Document findings in audits/UX_FINDINGS.md

5. Prioritize fixes that affect core user flows
```

---

## Option 6: Quick Audit (Find Issues Only, No Fixes)

```
Run a quick audit scan of perks-portal-v2 to identify issues without fixing them.

Execute these commands and report what you find:

# TypeScript issues
npm run type-check 2>&1 | head -50

# Any types
grep -r ": any" src/ --include="*.tsx" --include="*.ts"

# Spacing violations
grep -rE "p-[1357]|m-[1357]|gap-[1357]" src/ --include="*.tsx"

# Missing alt text
grep -rE "<img|<Image" src/ --include="*.tsx" | grep -v "alt="

# Hardcoded colors
grep -rE "#[0-9a-fA-F]{6}" src/components/ --include="*.tsx" | grep -v "0038FF"

# Console.log statements
grep -r "console.log" src/ --include="*.ts" --include="*.tsx"

# Missing validation in API routes
find src/app/api -name "route.ts" -exec grep -L "z\.\|schema" {} \;

Create a summary report of issues found without making any changes.
```

---

## Option 7: Fix Specific Category

```
Review and fix all [CATEGORY] issues in the perks-portal-v2 project.

Categories to choose from:
- "spacing" - Fix all non-8px grid spacing (p-3→p-4, p-5→p-6, etc.)
- "typescript" - Fix all TypeScript errors and any types
- "accessibility" - Add missing alt text, aria-labels, focus states
- "colors" - Replace non-brand colors with Bridge Blue tokens
- "validation" - Add Zod validation to API routes missing it
- "loading-states" - Add loading states to async operations

Read the relevant audit document first, then systematically find and fix all issues of that type.

Document what you changed in audits/FIXES_[CATEGORY].md
```

---

## Tips for Best Results

1. **Be specific** about what you want audited
2. **Start with security** (backend) if this is a production app
3. **Run type-check first** to catch obvious issues
4. **Review changes** before committing - ask Claude to show diffs
5. **Fix one category at a time** for cleaner commits

---

## After Running Audits

Ask Claude to:
```
Create a git commit with the audit fixes. Group related changes together and write clear commit messages explaining what was fixed and why.
```
