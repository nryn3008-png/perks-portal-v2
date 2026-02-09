You are about to update the CLAUDE.md file for this project. This file is critical — it's the ONLY context you'll have at the start of every new session. A bad CLAUDE.md means you'll make wrong assumptions, miss conventions, and waste time re-learning what you already know.

IMPORTANT: Follow these steps IN ORDER. Do NOT skip any step. Do NOT start writing the CLAUDE.md until you've completed all research steps.

---

### Step 1: Research the Current State (READ ONLY — no writing yet)

Investigate the project thoroughly before writing anything:

1. Read the existing CLAUDE.md (if it exists)
2. Read package.json for dependencies, scripts, and project metadata
3. Read tsconfig.json / next.config.js / tailwind.config.js for configuration
4. Read .env.example for environment variable names (NEVER include actual values)
5. Scan the top-level directory structure (2 levels deep)
6. Scan src/ directory structure (3 levels deep)
7. Check .claude/skills/ for available skill files — list each one
8. Check .claude/commands/ for custom slash commands
9. Check for supabase/ directory (migrations, types, schema)
10. Read the 5 most recently modified source files to understand current patterns
11. Run `git log --oneline -20` to understand recent work
12. Run `git branch` to see the branching structure
13. Check for TODOs: `grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" src/ | head -30`

---

### Step 2: Think Hard About What Matters

Before writing, consider:

- What would I NEED to know if I had zero memory and started a new session?
- What mistakes would I make without this file?
- What conventions exist that aren't obvious from the code alone?
- What's the current development focus / what's actively being built?
- What are the gotchas, quirks, or non-obvious architectural decisions?

---

### Step 3: Write the CLAUDE.md

Follow these rules:

**FORMAT RULES:**
- Keep it CONCISE — this goes into your system prompt every session. Bloat = noise.
- Use tables for structured data (stack, env vars, database tables)
- Use short bullet points, not paragraphs
- No redundant explanations — if it's obvious from the code, don't document it
- Target under 400 lines

**REQUIRED SECTIONS (in this order):**

1. **Context Preservation** — instruction to update CLAUDE.md before compaction
2. **Project Overview** — 3-4 lines max: what, who, core value prop
3. **Tech Stack** — table format
4. **Commands** — dev, build, lint, type-check
5. **Project Structure** — tree format, key directories only
6. **Authentication** — auth modes, middleware flow, admin access, provider-level access
7. **Access Control** — priority chain, animation, cookie caching
8. **API Routes** — consolidated table (group HTTP methods on same line)
9. **External Integrations** — GetProven, Bridge, Supabase with key details
10. **Database Schema** — tables with critical columns only
11. **Environment Variables** — table with Purpose and Scope columns, NO actual values
12. **CSV Upload** — format, validation rules, modal flow
13. **Design System** — Bridge tokens + MercuryOS tokens (tables)
14. **Skills** — list from .claude/skills/ with when-to-use
15. **Conventions** — naming, patterns, error handling, auth functions
16. **Current Development Focus** — recently completed + pending/known issues
17. **Gotchas & Warnings** — non-obvious pitfalls that WILL trip you up

---

### Step 4: Self-Review

Verify:
- [ ] Every section is useful, not filler
- [ ] A fresh session with ONLY this file would make correct assumptions
- [ ] No secrets, API keys, or sensitive data
- [ ] Under ~400 lines
- [ ] Commands are accurate and runnable
- [ ] Project structure matches reality
- [ ] Gotchas are genuinely non-obvious

---

### Step 5: Save and Summary

Write the final CLAUDE.md to the project root. Show a brief summary of what changed vs the previous version.
