# Perks Portal – Comprehensive Audit Suite

This folder contains comprehensive audit guides for Claude Code to systematically evaluate and improve the Perks Portal application across four key dimensions.

---

## Audit Documents

| Audit | Focus | Key Areas |
|-------|-------|-----------|
| [UX_AUDIT.md](./UX_AUDIT.md) | User Experience | Nielsen's heuristics, accessibility, user flows, friction points |
| [UI_AUDIT.md](./UI_AUDIT.md) | Visual Design | Design system compliance, colors, typography, spacing, components |
| [FRONTEND_AUDIT.md](./FRONTEND_AUDIT.md) | Code Quality | TypeScript, accessibility, state management, performance |
| [BACKEND_AUDIT.md](./BACKEND_AUDIT.md) | API & Security | Security, validation, error handling, production readiness |

---

## How to Use These Audits

### For Claude Code

These audits are designed to be run by Claude Code. Each document contains:
- **Checklists** of items to verify
- **Bash commands** to find issues automatically
- **Expected patterns** showing correct implementation
- **Fix templates** for common problems
- **Output format** for documenting findings

### Recommended Order

1. **Backend Audit** (security first)
   - Run security checks before anything else
   - Fix critical vulnerabilities immediately

2. **Frontend Audit** (code quality)
   - Fix TypeScript errors
   - Address accessibility issues
   - Standardize component patterns

3. **UI Audit** (visual consistency)
   - Ensure design system compliance
   - Standardize spacing and colors
   - Fix component inconsistencies

4. **UX Audit** (user experience)
   - Evaluate user flows
   - Identify friction points
   - Improve feedback and guidance

---

## Quick Start Commands

### Run All TypeScript Checks
```bash
npm run type-check
```

### Run Linting
```bash
npm run lint
```

### Check for Common Issues
```bash
# Find TypeScript 'any' types
grep -r ": any" src/ --include="*.tsx" --include="*.ts"

# Find spacing violations (non-8px)
grep -rE "p-[1357]|m-[1357]|gap-[1357]" src/ --include="*.tsx"

# Find hardcoded colors (should use tokens)
grep -rE "#[0-9a-fA-F]{6}" src/components/ --include="*.tsx"

# Find missing alt text
grep -rE "<img|<Image" src/ --include="*.tsx" | grep -v "alt="

# Find console.log statements
grep -r "console.log" src/ --include="*.ts" --include="*.tsx"
```

---

## Severity Levels

All audits use consistent severity levels:

| Level | Icon | Meaning | Action |
|-------|------|---------|--------|
| Critical | 🔴 | Blocks functionality, security risk, accessibility failure | Fix immediately |
| Major | 🟡 | Significant friction, inconsistency, poor UX | Fix soon |
| Minor | 🔵 | Polish, nice-to-have, optimization | Fix when possible |

---

## Documenting Findings

When running audits, document findings using this format:

```markdown
### Finding: [Short descriptive title]

**Severity:** 🔴 Critical / 🟡 Major / 🔵 Minor

**Audit:** UX / UI / Frontend / Backend

**Location:** `src/path/to/file.tsx:line`

**Issue:** [Clear description of the problem]

**Impact:** [User or system impact]

**Fix:**
\`\`\`tsx
// Before
...

// After
...
\`\`\`

**Verification:**
\`\`\`bash
# Command to verify fix
...
\`\`\`
```

---

## Reference Documents

These audits reference:

- **DESIGN_SYSTEM.md** – Authoritative design decisions (spacing, colors, components)
- **README.md** – Project overview and structure
- **tailwind.config.js** – Color tokens and theme configuration
- **.env.example** – Required environment variables

---

## Workflow for Improvements

1. **Pick an audit** to run
2. **Execute the commands** in each section
3. **Document findings** using the format above
4. **Prioritize by severity** (🔴 → 🟡 → 🔵)
5. **Fix issues** following the patterns provided
6. **Verify fixes** with the testing commands
7. **Commit changes** with descriptive messages
8. **Update documentation** if patterns change

---

## Audit Maintenance

These audits should be:
- **Run periodically** (weekly or per sprint)
- **Updated** when new patterns are established
- **Extended** when new areas need coverage

---

## Skills Reference

These audits are based on Anthropic's skill framework:

| Skill | Audit | Core Focus |
|-------|-------|------------|
| ux-consultant | UX_AUDIT.md | Usability, accessibility, user flows |
| ui-designer | UI_AUDIT.md | Visual design, design systems, consistency |
| frontend-developer | FRONTEND_AUDIT.md | Code quality, TypeScript, performance |
| backend-developer | BACKEND_AUDIT.md | APIs, security, databases, production |

---

**Consistency is a feature. Quality is non-negotiable.**
