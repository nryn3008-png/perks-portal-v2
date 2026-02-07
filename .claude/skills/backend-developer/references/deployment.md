# Deployment & Infrastructure

## Table of Contents

1. Deployment Strategy Selection
2. Vercel Deployment
3. Docker
4. CI/CD Pipeline
5. Database Deployment
6. Environment Management
7. Production Readiness Checklist
8. Monitoring and Logging

---

## 1. Deployment Strategy Selection

**Next.js / full-stack web app** → Vercel (zero-config, edge functions, preview deployments)

**Standalone API / microservice** → Docker on Railway, Render, Fly.io, or AWS ECS

**Static site + API** → Frontend on Vercel/Netlify, API on Railway/Render

**Complex multi-service** → Docker Compose locally, Kubernetes or ECS in production

**Quick prototype / MVP** → Vercel or Railway. Don't over-engineer infra for something that might pivot.

---

## 2. Vercel Deployment

### Project Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "crons": [
    { "path": "/api/cron/daily", "schedule": "0 9 * * *" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

### Environment Variables

Set via Vercel dashboard or CLI. Use different values per environment:
- **Production** — Real API keys, production database URL
- **Preview** — Staging API keys, staging database
- **Development** — Local/dev API keys

```bash
# Vercel CLI
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

### Serverless Function Limits

- Default timeout: 10s (Hobby), 60s (Pro), 300s (Enterprise)
- Max payload: 4.5MB request body
- Cold starts: ~250ms (Node.js), keep functions lean
- For long-running tasks: use background functions or queue to external service

---

## 3. Docker

### Node.js Dockerfile (Production)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

### Python Dockerfile (Production)

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

RUN adduser --system --uid 1001 appuser
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose (Local Development)

```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    env_file: .env.local
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: appdb
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s

volumes:
  pgdata:
```

---

## 4. CI/CD Pipeline

### GitHub Actions (Node.js)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

### Pre-Commit Checks

```json
// package.json — lint-staged + husky
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --fix",
    "typecheck": "tsc --noEmit"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 5. Database Deployment

### Migration Strategy

```bash
# Prisma
npx prisma migrate dev      # Development (creates + applies)
npx prisma migrate deploy   # Production (applies pending only)

# Drizzle
npx drizzle-kit generate    # Generate migration files
npx drizzle-kit migrate     # Apply migrations
```

### Database Branching (Supabase / Neon / PlanetScale)

- **Main branch** → Production database
- **Preview branches** → Auto-created preview databases per PR
- Migrations run automatically on branch creation
- Branch databases destroyed when PR closes

### Backup Strategy

- Automated daily backups (most managed databases include this)
- Point-in-time recovery enabled
- Test restore procedure quarterly
- Keep 30 days of backups minimum

---

## 6. Environment Management

### .env File Structure

```bash
# .env.example (committed to repo — no real values)
DATABASE_URL=postgresql://user:pass@localhost:5432/appdb
JWT_SECRET=your-secret-min-32-chars
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# .env.local (NOT committed — real local values)
# .env.production (NOT committed — or set via deployment platform)
```

### Env Validation

```typescript
// Validate at startup — fail fast
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string(),
  // Public vars (accessible on client in Next.js)
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

---

## 7. Production Readiness Checklist

### Before Going Live

**Security:**
- [ ] All secrets in environment variables
- [ ] HTTPS enforced everywhere
- [ ] CORS restricted to known origins
- [ ] Rate limiting on auth and public endpoints
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] Auth tested: can't access other users' data
- [ ] File upload restrictions (type, size)

**Reliability:**
- [ ] Health check endpoint (`/health` or `/api/health`)
- [ ] Database connection pooling configured
- [ ] Graceful shutdown handling
- [ ] Error tracking set up (Sentry or similar)
- [ ] Timeouts on all external calls

**Performance:**
- [ ] Database indexes on queried columns
- [ ] Pagination on all list endpoints
- [ ] Static assets cached (CDN)
- [ ] Images optimized (Next.js Image or similar)
- [ ] No N+1 query problems

**Operations:**
- [ ] Structured logging (JSON format)
- [ ] Monitoring dashboards
- [ ] Alerting on error rate spikes
- [ ] Database backups verified
- [ ] Rollback procedure documented

---

## 8. Monitoring and Logging

### Structured Logging

```typescript
// Use structured JSON logs — not console.log("something happened")
function log(level: "info" | "warn" | "error", message: string, meta?: object) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  }))
}

// Usage
log("info", "User created", { userId: user.id, email: user.email })
log("error", "Payment failed", { userId, error: error.message, stripeId })
```

### Health Check Endpoint

```typescript
// GET /api/health
export async function GET() {
  const checks = {
    database: false,
    redis: false,
  }

  try {
    await db.$queryRaw`SELECT 1`
    checks.database = true
  } catch {}

  try {
    await redis.ping()
    checks.redis = true
  } catch {}

  const healthy = Object.values(checks).every(Boolean)
  return Response.json(
    { status: healthy ? "healthy" : "degraded", checks },
    { status: healthy ? 200 : 503 }
  )
}
```
