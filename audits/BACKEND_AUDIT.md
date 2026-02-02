# Perks Portal – Backend Audit Guide

**Purpose:** This document provides a comprehensive backend code audit framework for Claude Code to evaluate and improve the API design, security, error handling, and production readiness of the Perks Portal application.

---

## How to Use This Audit

1. **Run security checks** first (highest priority)
2. **Audit API routes** for consistency
3. **Check error handling** patterns
4. **Verify production readiness**
5. **Document and fix issues**

---

## 1. Security Audit

### 1.1 Input Validation

**Checks:**
- [ ] All API inputs validated with Zod schemas
- [ ] No raw request body used without validation
- [ ] Query parameters typed and validated
- [ ] File uploads restricted (type, size)

**Audit Commands:**
```bash
# Check for Zod usage
grep -r "from 'zod'" src/app/api/ --include="*.ts"

# Find routes without validation
grep -rL "z\.\|schema\|parse" src/app/api/**/*.ts

# Check for raw body access
grep -r "request.json()" src/app/api/ --include="*.ts"

# Check for query param validation
grep -r "searchParams.get" src/app/api/ --include="*.ts"
```

**Expected Patterns:**
```typescript
// ✅ Correct - validated input
import { z } from 'zod'

const createPerkSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string(),
  value: z.number().positive().optional(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = createPerkSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: { code: 'VALIDATION', message: parsed.error.issues } },
      { status: 400 }
    )
  }

  // Use parsed.data - fully validated
}

// ❌ Wrong - no validation
export async function POST(request: Request) {
  const body = await request.json()
  // Using body directly without validation
}
```

**Files to Check:**
```
src/app/api/perks/route.ts
src/app/api/vendors/route.ts
src/app/api/admin/whitelist/domains/route.ts
src/app/api/admin/whitelist/individual-access/route.ts
src/app/api/admin/whitelist/upload/route.ts
```

---

### 1.2 Authentication & Authorization

**Checks:**
- [ ] All protected routes check authentication
- [ ] Admin routes verify admin role
- [ ] User can only access their own resources
- [ ] Sensitive endpoints rate limited

**Audit Commands:**
```bash
# Check for auth middleware usage
grep -r "authenticate\|getSession\|auth" src/app/api/ --include="*.ts"

# Check admin routes for role verification
grep -r "role\|admin\|isAdmin" src/app/api/admin/ --include="*.ts"

# Find routes without auth checks
find src/app/api -name "route.ts" -exec grep -L "auth\|session" {} \;
```

**Expected Patterns:**
```typescript
// ✅ Correct - auth check first
export async function GET(request: Request) {
  const session = await getSession(request)
  if (!session) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  // Proceed with authenticated request
}

// ✅ Admin route with role check
export async function DELETE(request: Request) {
  const session = await getSession(request)
  if (!session || session.user.role !== 'admin') {
    return Response.json(
      { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 }
    )
  }

  // Proceed with admin action
}
```

---

### 1.3 Environment Variables

**Checks:**
- [ ] All secrets in environment variables
- [ ] No hardcoded API keys
- [ ] Env vars validated at startup
- [ ] Different values per environment

**Audit Commands:**
```bash
# Check for hardcoded secrets
grep -rE "sk_\|pk_\|api_key=|apikey=|secret=" src/ --include="*.ts" --include="*.tsx"

# Check env usage
grep -r "process.env" src/ --include="*.ts" | head -20

# Check env.example vs actual usage
cat .env.example
```

**Expected Patterns:**
```typescript
// ✅ Correct - validated env config
// src/lib/config.ts
import { z } from 'zod'

const envSchema = z.object({
  GETPROVEN_API_TOKEN: z.string().min(1),
  GETPROVEN_API_URL: z.string().url(),
  BRIDGE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)

// ❌ Wrong - raw access without validation
const apiKey = process.env.API_KEY
```

---

### 1.4 SQL Injection Prevention

**Checks:**
- [ ] All queries use parameterized statements
- [ ] No string concatenation in queries
- [ ] ORM (Supabase) used correctly

**Audit Commands:**
```bash
# Check for raw SQL
grep -rE "\.from\(|\.select\(|\.insert\(|\.update\(" src/ --include="*.ts"

# Check for string interpolation in queries
grep -rE "\$\{.*\}.*from\(|\$\{.*\}.*select\(" src/ --include="*.ts"

# Check Supabase usage
grep -r "supabase" src/lib/ --include="*.ts"
```

**Expected Patterns:**
```typescript
// ✅ Correct - parameterized query
const { data } = await supabase
  .from('perks')
  .select('*')
  .eq('id', perkId)  // Parameter properly escaped

// ❌ Wrong - string interpolation
const { data } = await supabase
  .from('perks')
  .select('*')
  .filter(`id = ${perkId}`)  // SQL injection risk
```

---

### 1.5 CORS Configuration

**Checks:**
- [ ] CORS restricted to known origins
- [ ] Preflight handled correctly
- [ ] Credentials handled properly

**Audit Commands:**
```bash
# Check for CORS headers
grep -r "Access-Control" src/ --include="*.ts"

# Check next.config.js for CORS
grep -r "headers\|cors" next.config.js
```

**Expected Patterns:**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

---

## 2. API Design Audit

### 2.1 REST Conventions

**Checks:**
- [ ] Consistent URL patterns
- [ ] Correct HTTP methods
- [ ] Proper status codes
- [ ] Consistent response format

**Audit Commands:**
```bash
# List all API routes
find src/app/api -name "route.ts" | sort

# Check HTTP methods used
grep -rE "export async function (GET|POST|PUT|PATCH|DELETE)" src/app/api/ --include="*.ts"

# Check status codes
grep -rE "status: [0-9]+" src/app/api/ --include="*.ts"
```

**REST Conventions Reference:**
| Method | Path | Action | Status |
|--------|------|--------|--------|
| GET | /api/perks | List perks | 200 |
| GET | /api/perks/:id | Get perk | 200 or 404 |
| POST | /api/perks | Create perk | 201 |
| PATCH | /api/perks/:id | Update perk | 200 |
| DELETE | /api/perks/:id | Delete perk | 204 |

**Status Code Reference:**
```typescript
// Success
200 // OK - GET, PATCH, PUT
201 // Created - POST
204 // No Content - DELETE

// Client Errors
400 // Bad Request - validation error
401 // Unauthorized - not authenticated
403 // Forbidden - not authorized
404 // Not Found - resource doesn't exist
409 // Conflict - duplicate
422 // Unprocessable - semantic error
429 // Too Many Requests - rate limited

// Server Errors
500 // Internal Server Error
502 // Bad Gateway - upstream error
503 // Service Unavailable
```

---

### 2.2 Response Format

**Checks:**
- [ ] Consistent success response shape
- [ ] Consistent error response shape
- [ ] Pagination included for lists
- [ ] Metadata where appropriate

**Audit Commands:**
```bash
# Check response patterns
grep -rE "Response.json\(" src/app/api/ --include="*.ts" | head -20

# Check for error response format
grep -r "error:" src/app/api/ --include="*.ts"
```

**Expected Patterns:**
```typescript
// ✅ Success response - single resource
return Response.json({
  data: perk,
})

// ✅ Success response - list with pagination
return Response.json({
  data: perks,
  meta: {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  },
})

// ✅ Error response
return Response.json(
  {
    error: {
      code: 'NOT_FOUND',
      message: 'Perk not found',
    },
  },
  { status: 404 }
)

// ❌ Inconsistent error format
return Response.json({ message: 'Error' }, { status: 400 })
return Response.json({ error: 'Error' }, { status: 400 })
```

---

### 2.3 API Documentation

**Check that each endpoint documents:**
- [ ] Method and path
- [ ] Request parameters/body
- [ ] Response shape
- [ ] Error cases

**Current API Routes:**
```
GET  /api/perks              - List perks with pagination
GET  /api/perks/:id          - Get single perk
GET  /api/perks/filters      - Get filter options
GET  /api/perks/totals       - Get perk counts
GET  /api/vendors            - List vendors
GET  /api/vendors/:id        - Get single vendor
GET  /api/vendors/:id/clients - Get vendor clients
GET  /api/vendors/:id/contacts - Get vendor contacts
GET  /api/vendors/filters    - Get vendor filter options
GET  /api/health             - Health check
POST /api/auth/login         - User login
POST /api/auth/logout        - User logout
GET  /api/admin/whitelist/domains - List whitelisted domains
POST /api/admin/whitelist/domains - Add domain
DELETE /api/admin/whitelist/domains - Remove domain
```

---

## 3. Error Handling Audit

### 3.1 Error Class Pattern

**Checks:**
- [ ] Custom error classes defined
- [ ] Errors have code, status, message
- [ ] Errors properly caught and transformed

**Audit Commands:**
```bash
# Check for error classes
grep -r "class.*Error" src/lib/ --include="*.ts"

# Check for try-catch patterns
grep -rE "try\s*\{" src/app/api/ --include="*.ts"

# Check for error handling
grep -r "catch" src/app/api/ --include="*.ts"
```

**Expected Patterns:**
```typescript
// ✅ Custom error class
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', 404, `${resource} not found`)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION', 400, message)
  }
}

// ✅ Error handling in route
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const perk = await getPerkById(params.id)
    if (!perk) {
      throw new NotFoundError('Perk')
    }
    return Response.json({ data: perk })
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      )
    }
    console.error('Unexpected error:', error)
    return Response.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

---

### 3.2 External API Error Handling

**Checks:**
- [ ] GetProven API errors handled
- [ ] Bridge API errors handled gracefully
- [ ] Timeouts configured
- [ ] Retries for transient failures

**Audit Commands:**
```bash
# Check external API clients
cat src/lib/api/getproven-client.ts
cat src/lib/api/bridge-client.ts

# Check for timeout configuration
grep -r "timeout\|AbortSignal" src/lib/api/ --include="*.ts"
```

**Expected Patterns:**
```typescript
// ✅ External API call with timeout and error handling
async function fetchFromGetProven(endpoint: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const response = await fetch(`${env.GETPROVEN_API_URL}${endpoint}`, {
      headers: {
        Authorization: `Token ${env.GETPROVEN_API_TOKEN}`,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new AppError(
        'UPSTREAM_ERROR',
        502,
        `GetProven API error: ${response.status}`
      )
    }

    return response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new AppError('TIMEOUT', 504, 'GetProven API timeout')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
```

---

### 3.3 Logging

**Checks:**
- [ ] Structured JSON logging
- [ ] Errors logged with context
- [ ] No sensitive data in logs
- [ ] Request ID tracking

**Audit Commands:**
```bash
# Check logging patterns
grep -r "console.log\|console.error" src/ --include="*.ts"

# Check for sensitive data in logs
grep -rE "password|secret|token|key" src/ --include="*.ts" | grep -E "log|console"
```

**Expected Patterns:**
```typescript
// ✅ Structured logging
function log(level: 'info' | 'warn' | 'error', message: string, meta?: object) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  }))
}

// Usage
log('error', 'Perk fetch failed', {
  perkId,
  error: error.message,
  // Never log: password, token, apiKey, etc.
})

// ❌ Wrong - unstructured, might leak sensitive data
console.log('Error:', error)
console.log('Request:', request.body)  // Might contain sensitive data
```

---

## 4. Database Audit

### 4.1 Supabase Usage

**Checks:**
- [ ] Client properly configured
- [ ] RLS policies in place
- [ ] Queries optimized
- [ ] Connections properly managed

**Audit Commands:**
```bash
# Check Supabase client setup
cat src/lib/supabase.ts 2>/dev/null || cat src/lib/api/supabase-client.ts 2>/dev/null

# Check for direct database access
grep -r "supabase" src/app/api/ --include="*.ts"
```

**Expected Patterns:**
```typescript
// ✅ Supabase client configuration
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
})

// ✅ Query with proper error handling
async function getPerks(filters: PerkFilters) {
  let query = supabase
    .from('perks')
    .select('*, vendor:vendors(*)')
    .order('created_at', { ascending: false })

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query

  if (error) {
    throw new AppError('DATABASE_ERROR', 500, error.message)
  }

  return data
}
```

---

### 4.2 Query Optimization

**Checks:**
- [ ] Indexes on filtered columns
- [ ] Select only needed columns
- [ ] Pagination on all list endpoints
- [ ] No N+1 query problems

**Audit Commands:**
```bash
# Check for select * (should select specific columns)
grep -r "select\('\*'\)" src/ --include="*.ts"

# Check pagination implementation
grep -r "range\|limit\|offset" src/app/api/ --include="*.ts"
```

**Expected Patterns:**
```typescript
// ✅ Select specific columns
const { data } = await supabase
  .from('perks')
  .select('id, name, description, vendor_id')

// ❌ Select all columns
const { data } = await supabase
  .from('perks')
  .select('*')

// ✅ Paginated query
const { data, count } = await supabase
  .from('perks')
  .select('*', { count: 'exact' })
  .range(offset, offset + pageSize - 1)
```

---

## 5. Performance Audit

### 5.1 Caching

**Checks:**
- [ ] Static data cached appropriately
- [ ] Cache headers set correctly
- [ ] Stale-while-revalidate where appropriate

**Audit Commands:**
```bash
# Check for cache headers
grep -r "Cache-Control" src/app/api/ --include="*.ts"

# Check for revalidation
grep -r "revalidate" src/app/ --include="*.ts"
```

**Expected Patterns:**
```typescript
// ✅ Cache static data
export async function GET() {
  const filters = await getFilterOptions()

  return Response.json(
    { data: filters },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  )
}

// ✅ No cache for user-specific data
export async function GET(request: Request) {
  const session = await getSession(request)
  const userData = await getUserData(session.userId)

  return Response.json(
    { data: userData },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  )
}
```

---

### 5.2 Rate Limiting

**Checks:**
- [ ] Rate limiting on auth endpoints
- [ ] Rate limiting on public endpoints
- [ ] Meaningful limits based on use case

**Audit Commands:**
```bash
# Check for rate limiting middleware
grep -r "rateLimit\|rate-limit" src/ --include="*.ts"

# Check middleware.ts
cat src/middleware.ts
```

**Expected Patterns:**
```typescript
// src/middleware.ts or rate limit utility
const RATE_LIMITS = {
  auth: { window: 60000, max: 5 },      // 5 requests per minute
  api: { window: 60000, max: 100 },     // 100 requests per minute
}

// Rate limiter implementation would track:
// - IP address or user ID
// - Request count within window
// - Return 429 when exceeded
```

---

## 6. Production Readiness

### 6.1 Health Check

**Checks:**
- [ ] `/api/health` endpoint exists
- [ ] Checks database connectivity
- [ ] Checks external API connectivity
- [ ] Returns structured status

**Audit Commands:**
```bash
# Check health endpoint
cat src/app/api/health/route.ts
```

**Expected Patterns:**
```typescript
// ✅ Comprehensive health check
export async function GET() {
  const checks = {
    database: false,
    getproven: false,
    bridge: false,
  }

  // Check database
  try {
    await supabase.from('perks').select('count').limit(1)
    checks.database = true
  } catch {}

  // Check GetProven API
  try {
    const response = await fetch(`${env.GETPROVEN_API_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    checks.getproven = response.ok
  } catch {}

  // Check Bridge API (optional)
  if (env.BRIDGE_API_KEY) {
    try {
      const response = await fetch(`${env.BRIDGE_API_BASE_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      })
      checks.bridge = response.ok
    } catch {}
  } else {
    checks.bridge = true // Not configured, skip
  }

  const healthy = Object.values(checks).every(Boolean)

  return Response.json(
    { status: healthy ? 'healthy' : 'degraded', checks },
    { status: healthy ? 200 : 503 }
  )
}
```

---

### 6.2 Environment Validation

**Checks:**
- [ ] All required env vars documented
- [ ] Validation at startup
- [ ] Fail fast on missing vars

**Files to Check:**
```
.env.example
src/lib/config.ts (or wherever env is validated)
```

**Expected Patterns:**
```typescript
// ✅ Fail fast on invalid env
// This should run when the app starts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  GETPROVEN_API_TOKEN: z.string().min(1, 'GETPROVEN_API_TOKEN required'),
  GETPROVEN_API_URL: z.string().url(),
  BRIDGE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
})

// Will throw at startup if invalid
export const env = envSchema.parse(process.env)
```

---

### 6.3 Security Checklist

Run before production deployment:

- [ ] All inputs validated (Zod)
- [ ] SQL queries parameterized
- [ ] Authentication on protected routes
- [ ] Authorization checks on admin routes
- [ ] Secrets in environment variables
- [ ] CORS configured correctly
- [ ] Rate limiting on sensitive endpoints
- [ ] No sensitive data in logs
- [ ] Error messages don't leak internals
- [ ] HTTPS enforced

---

## 7. API Route Audit Template

For each route in `src/app/api/`, verify:

```markdown
### Route: /api/[path]

**File:** `src/app/api/[path]/route.ts`

**Methods:** GET / POST / PATCH / DELETE

**Authentication:** ✅ Required / ❌ Public

**Validation:**
- [ ] Request body validated with Zod
- [ ] Query params typed and validated
- [ ] Path params validated

**Error Handling:**
- [ ] Try-catch wraps logic
- [ ] Custom errors used
- [ ] Errors return proper status codes
- [ ] Internal errors don't leak details

**Response Format:**
- [ ] Success: `{ data: ... }`
- [ ] List: `{ data: [...], meta: { ... } }`
- [ ] Error: `{ error: { code, message } }`

**Performance:**
- [ ] Database queries optimized
- [ ] Appropriate caching
- [ ] Timeout on external calls

**Issues Found:**
1. ...
2. ...
```

---

## 8. Audit Output Format

```markdown
### Finding: [Issue Title]

**Severity:** 🔴 Critical / 🟡 Major / 🔵 Minor

**Category:** Security / API Design / Error Handling / Performance

**Location:** `src/app/api/[path]/route.ts:line`

**Issue:** [Description]

**Risk:** [Potential impact]

**Fix:**
\`\`\`typescript
// Before
...

// After
...
\`\`\`

**Verification:**
\`\`\`bash
# How to verify the fix
curl http://localhost:3002/api/...
\`\`\`
```

---

## 9. Priority Matrix

### Critical (🔴) - Fix Immediately
- SQL injection vulnerabilities
- Missing authentication
- Hardcoded secrets
- Exposed error details

### Major (🟡) - Fix Soon
- Missing input validation
- Inconsistent error handling
- Missing rate limiting
- No request timeouts

### Minor (🔵) - Improve When Possible
- Inconsistent response format
- Missing caching
- Verbose logging
- Code organization

---

## 10. Post-Audit Actions

1. **Fix security issues** first (🔴 Critical)
2. **Standardize error handling** across all routes
3. **Add missing validation** with Zod schemas
4. **Implement rate limiting** on sensitive endpoints
5. **Add comprehensive health check**
6. **Document all API endpoints**
7. **Set up monitoring and alerting**

---

**This audit is based on the backend-developer skill framework.**
**Security is non-negotiable. Validate all inputs. Handle all errors.**
