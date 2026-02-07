# Authentication & Authorization Patterns

## Table of Contents

1. Auth Strategy Selection
2. JWT Authentication
3. Session-Based Authentication
4. OAuth / Social Login
5. Role-Based Access Control (RBAC)
6. Row-Level Security (RLS)
7. API Key Authentication
8. Multi-Factor Authentication (MFA)

---

## 1. Auth Strategy Selection

**Next.js / full-stack web app** → NextAuth.js (Auth.js) or Supabase Auth. Session-based with HTTP-only cookies.

**SPA + separate API** → JWT with short-lived access tokens (15min) + long-lived refresh tokens (7-30 days) in HTTP-only cookies.

**Mobile app + API** → JWT with refresh tokens. Store tokens in secure storage (Keychain/Keystore), never AsyncStorage.

**Internal / B2B tool** → OAuth with corporate IdP (Google Workspace, Okta, Azure AD). SAML for enterprise.

**Public API** → API keys for server-to-server. OAuth2 with PKCE for user-facing integrations.

**Simple MVP / prototype** → Supabase Auth or Clerk. Don't build auth from scratch unless you have a specific reason.

---

## 2. JWT Authentication

### Token Structure

```typescript
// Access token payload (keep minimal — this is sent with every request)
{
  sub: "user_123",           // User ID
  email: "user@example.com",
  role: "admin",             // For RBAC
  iat: 1700000000,           // Issued at
  exp: 1700000900,           // Expires (15 min)
}

// Refresh token: opaque string stored in database
// Links to user_id, expires in 7-30 days, single-use (rotate on refresh)
```

### Implementation Pattern

```typescript
// Token creation
import jwt from "jsonwebtoken"

function generateTokens(user: User) {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "15m" }
  )

  const refreshToken = crypto.randomUUID()
  // Store refreshToken hash in database with user_id and expiry

  return { accessToken, refreshToken }
}

// Token verification middleware
function authenticate(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "")
  if (!token) throw new AppError("UNAUTHORIZED", 401, "Missing token")

  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    return payload
  } catch {
    throw new AppError("UNAUTHORIZED", 401, "Invalid or expired token")
  }
}
```

### Token Storage (Client-Side)

**Web apps:** HTTP-only, Secure, SameSite=Lax cookies. NEVER localStorage or sessionStorage for tokens.

**Mobile apps:** Platform secure storage only (iOS Keychain, Android Keystore).

### Refresh Flow

```
1. Client sends request with expired access token
2. Server returns 401
3. Client sends refresh token to /api/auth/refresh
4. Server validates refresh token against database
5. Server generates new access token + new refresh token
6. Server invalidates old refresh token (rotation)
7. Client retries original request with new access token
```

---

## 3. Session-Based Authentication

Preferred for server-rendered apps (Next.js, Rails, Django).

```typescript
// Session creation on login
const sessionId = crypto.randomUUID()
await db.session.create({
  id: sessionId,
  userId: user.id,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
})

// Set cookie
cookies().set("session_id", sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60,
  path: "/",
})

// Session validation middleware
async function getSession(request: Request) {
  const sessionId = cookies().get("session_id")?.value
  if (!sessionId) return null

  const session = await db.session.findUnique({
    where: { id: sessionId, expiresAt: { gt: new Date() } },
    include: { user: true },
  })
  return session
}
```

---

## 4. OAuth / Social Login

### OAuth2 + PKCE Flow (recommended for SPAs and mobile)

```
1. Generate code_verifier (random 43-128 chars)
2. Generate code_challenge = base64url(sha256(code_verifier))
3. Redirect to provider: /authorize?response_type=code&code_challenge=...
4. User authenticates with provider
5. Provider redirects back with authorization code
6. Exchange code + code_verifier for tokens at provider's /token endpoint
7. Use provider's access token to fetch user profile
8. Create or update local user record
9. Issue your own session/JWT
```

### Provider Integration Pattern

```typescript
// After OAuth callback — create or link account
async function handleOAuthCallback(provider: string, profile: OAuthProfile) {
  // Check if account already linked
  let account = await db.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.id } },
    include: { user: true },
  })

  if (account) return account.user

  // Check if user exists with same email
  let user = await db.user.findUnique({ where: { email: profile.email } })

  if (user) {
    // Link new provider to existing user
    await db.account.create({ data: { userId: user.id, provider, providerAccountId: profile.id } })
    return user
  }

  // Create new user + account
  user = await db.user.create({
    data: {
      email: profile.email,
      name: profile.name,
      image: profile.avatar,
      accounts: { create: { provider, providerAccountId: profile.id } },
    },
  })
  return user
}
```

---

## 5. Role-Based Access Control (RBAC)

### Simple Role Check

```typescript
// Define roles and permissions
const PERMISSIONS = {
  admin: ["read", "write", "delete", "manage_users", "manage_settings"],
  editor: ["read", "write"],
  viewer: ["read"],
} as const

type Role = keyof typeof PERMISSIONS

function authorize(userRole: Role, requiredPermission: string) {
  if (!PERMISSIONS[userRole]?.includes(requiredPermission)) {
    throw new AppError("FORBIDDEN", 403, "Insufficient permissions")
  }
}

// Usage in route handler
const user = await authenticate(request)
authorize(user.role, "manage_users")
```

### Resource-Level Authorization

```typescript
// Check ownership — user can only modify their own resources
async function authorizeResource(userId: string, resourceId: string) {
  const resource = await db.resource.findUnique({ where: { id: resourceId } })
  if (!resource) throw new AppError("NOT_FOUND", 404, "Resource not found")
  if (resource.ownerId !== userId) {
    throw new AppError("FORBIDDEN", 403, "You don't have access to this resource")
  }
  return resource
}
```

### Organization/Team Scoping

```typescript
// Multi-tenant: always scope queries to the user's organization
async function getTeamResources(userId: string, teamId: string) {
  // First verify user belongs to this team
  const membership = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  })
  if (!membership) throw new AppError("FORBIDDEN", 403, "Not a team member")

  // Then query scoped to team
  return db.resource.findMany({ where: { teamId } })
}
```

---

## 6. Row-Level Security (RLS) — Supabase / PostgreSQL

```sql
-- Enable RLS on table
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Users can only see their own resources
CREATE POLICY "Users see own resources"
  ON resources FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own resources
CREATE POLICY "Users create own resources"
  ON resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own resources
CREATE POLICY "Users update own resources"
  ON resources FOR UPDATE
  USING (auth.uid() = user_id);

-- Team-scoped access
CREATE POLICY "Team members see team resources"
  ON resources FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Admin bypass
CREATE POLICY "Admins see all"
  ON resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 7. API Key Authentication

For server-to-server or public API access.

```typescript
// Key generation
function generateApiKey(): { key: string; hash: string } {
  const key = `sk_live_${crypto.randomBytes(32).toString("hex")}`
  const hash = crypto.createHash("sha256").update(key).digest("hex")
  return { key, hash } // Store hash in DB, show key to user once
}

// Key validation
async function authenticateApiKey(request: Request) {
  const key = request.headers.get("X-API-Key")
  if (!key) throw new AppError("UNAUTHORIZED", 401, "Missing API key")

  const hash = crypto.createHash("sha256").update(key).digest("hex")
  const apiKey = await db.apiKey.findUnique({
    where: { hash, revokedAt: null },
    include: { user: true },
  })

  if (!apiKey) throw new AppError("UNAUTHORIZED", 401, "Invalid API key")
  return apiKey.user
}
```

---

## 8. Multi-Factor Authentication (MFA)

### TOTP (Time-Based One-Time Password)

```typescript
import { authenticator } from "otplib"

// Setup: generate secret, show QR code
function setupMFA(user: User) {
  const secret = authenticator.generateSecret()
  const uri = authenticator.keyuri(user.email, "AppName", secret)
  // Store encrypted secret in DB, return URI for QR code
  return { secret, uri }
}

// Verification
function verifyMFA(secret: string, token: string): boolean {
  return authenticator.verify({ token, secret })
}

// Login flow with MFA:
// 1. Validate email + password
// 2. If MFA enabled, return { requiresMFA: true, tempToken }
// 3. Client shows MFA input
// 4. Validate TOTP code with tempToken
// 5. Issue full session/JWT
```
