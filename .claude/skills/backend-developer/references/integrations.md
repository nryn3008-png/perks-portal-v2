# Third-Party Integrations

## Table of Contents

1. Integration Principles
2. Payments (Stripe)
3. Email (Resend / SendGrid / Nodemailer)
4. File Storage (S3 / Supabase Storage / Cloudflare R2)
5. Webhooks (Receiving and Sending)
6. Background Jobs and Queues
7. Caching (Redis)
8. Real-Time (WebSocket / SSE)
9. AI/LLM Integration (OpenAI / Anthropic)
10. SMS and Notifications

---

## 1. Integration Principles

**Wrap every external call.** Create a service wrapper around every third-party SDK. Never call Stripe/AWS/etc directly from route handlers. This isolates dependencies and makes testing/swapping services easy.

**Handle failures.** Every external call can fail. Use try/catch, set timeouts, implement retries with exponential backoff for transient failures.

**Idempotency.** For payment and webhook processing, use idempotency keys. Never process the same event twice.

**Secrets management.** All API keys in env vars. Different keys for dev/staging/production. Rotate regularly.

**Rate limiting awareness.** Know the rate limits of every service you integrate. Implement client-side throttling if needed.

```typescript
// Standard integration wrapper pattern
class StripeService {
  private client: Stripe

  constructor() {
    this.client = new Stripe(env.STRIPE_SECRET_KEY)
  }

  async createCustomer(email: string, name: string) {
    try {
      return await this.client.customers.create({ email, name })
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError("PAYMENT_ERROR", 502, error.message)
      }
      throw error
    }
  }
}
```

---

## 2. Payments (Stripe)

### Checkout Flow

```typescript
// Create checkout session
async function createCheckoutSession(userId: string, priceId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })

  const session = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,         // Create customer first if none
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",                    // or "payment" for one-time
    success_url: `${env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/pricing`,
    metadata: { userId },                    // For webhook reference
  })

  return session.url
}
```

### Webhook Handling

```typescript
// CRITICAL: verify webhook signature
async function handleStripeWebhook(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Process idempotently — check if already processed
  const existing = await db.processedEvent.findUnique({ where: { eventId: event.id } })
  if (existing) return Response.json({ received: true })

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object)
      break
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event.data.object)
      break
    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object)
      break
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object)
      break
  }

  // Mark as processed
  await db.processedEvent.create({ data: { eventId: event.id } })
  return Response.json({ received: true })
}
```

### Subscription Model

```sql
-- Store subscription state locally (synced via webhooks)
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, canceled, past_due, trialing
  plan TEXT NOT NULL,   -- free, pro, enterprise
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. Email

### Transactional Email Pattern

```typescript
// Wrap the provider — easy to swap between Resend, SendGrid, etc.
interface EmailService {
  send(options: {
    to: string
    subject: string
    html: string
    from?: string
  }): Promise<{ id: string }>
}

// Resend implementation
import { Resend } from "resend"

class ResendEmailService implements EmailService {
  private client = new Resend(env.RESEND_API_KEY)

  async send({ to, subject, html, from }) {
    const { data, error } = await this.client.emails.send({
      from: from || "App <noreply@yourdomain.com>",
      to, subject, html,
    })
    if (error) throw new AppError("EMAIL_ERROR", 502, error.message)
    return { id: data.id }
  }
}

// Common email types to implement:
// - Welcome / verification email
// - Password reset
// - Invoice / receipt
// - Team invitation
// - Notification digest
```

---

## 4. File Storage

### Upload Pattern (Presigned URLs)

```typescript
// Generate presigned upload URL (client uploads directly to S3/R2)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

async function getUploadUrl(userId: string, filename: string, contentType: string) {
  // Validate file type
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new AppError("VALIDATION", 400, "File type not allowed")
  }

  const key = `uploads/${userId}/${crypto.randomUUID()}-${filename}`

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: 10 * 1024 * 1024, // Max 10MB
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }) // 5 min
  return { uploadUrl: url, key }
}
```

### Supabase Storage Pattern

```typescript
const { data, error } = await supabase.storage
  .from("avatars")
  .upload(`${userId}/${filename}`, file, {
    contentType: file.type,
    upsert: true,
  })

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from("avatars")
  .getPublicUrl(data.path)
```

---

## 5. Webhooks

### Receiving Webhooks

```typescript
// Always:
// 1. Verify signature
// 2. Process idempotently
// 3. Return 200 quickly (do heavy work async)
// 4. Log everything

async function handleWebhook(request: Request) {
  const body = await request.text()

  // Verify (method varies by provider)
  if (!verifySignature(body, request.headers.get("x-signature"), env.WEBHOOK_SECRET)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(body)

  // Idempotency check
  const processed = await db.webhookEvent.findUnique({ where: { eventId: event.id } })
  if (processed) return Response.json({ ok: true })

  // Process (or queue for async processing)
  await processEvent(event)
  await db.webhookEvent.create({ data: { eventId: event.id, type: event.type } })

  return Response.json({ ok: true })
}
```

### Sending Webhooks

```typescript
async function sendWebhook(url: string, event: object, secret: string) {
  const payload = JSON.stringify(event)
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
    },
    body: payload,
    signal: AbortSignal.timeout(10000), // 10s timeout
  })

  // Retry with backoff on failure (5xx or timeout)
  if (!response.ok && response.status >= 500) {
    await queueRetry(url, event, secret, { attempt: 1, maxAttempts: 5 })
  }
}
```

---

## 6. Background Jobs and Queues

### Simple Queue Pattern (Database-Backed)

```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  run_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_pending ON jobs (run_at) WHERE status = 'pending';
```

### Cron Job Pattern

```typescript
// Vercel cron (vercel.json)
{ "crons": [{ "path": "/api/cron/daily-digest", "schedule": "0 9 * * *" }] }

// Cron handler
export async function GET(request: Request) {
  // Verify cron secret
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  await sendDailyDigestEmails()
  return Response.json({ ok: true })
}
```

---

## 7. Caching (Redis)

```typescript
// Cache-aside pattern
async function getUserProfile(userId: string) {
  const cacheKey = `user:${userId}`

  // Check cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Cache miss — fetch from DB
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError("NOT_FOUND", 404, "User not found")

  // Cache for 5 minutes
  await redis.set(cacheKey, JSON.stringify(user), "EX", 300)
  return user
}

// Invalidate on mutation
async function updateUser(userId: string, data: UpdateUserInput) {
  const user = await db.user.update({ where: { id: userId }, data })
  await redis.del(`user:${userId}`) // Invalidate cache
  return user
}
```

---

## 8. Real-Time

### Server-Sent Events (SSE)

```typescript
// Simpler than WebSocket for server→client push
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Subscribe to events
      const unsubscribe = eventBus.subscribe("updates", send)

      request.signal.addEventListener("abort", () => {
        unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

### Supabase Realtime

```typescript
// Subscribe to database changes
const channel = supabase
  .channel("room1")
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "messages",
    filter: `room_id=eq.${roomId}`,
  }, (payload) => {
    handleNewMessage(payload.new)
  })
  .subscribe()
```

---

## 9. AI/LLM Integration

```typescript
// Anthropic / OpenAI wrapper
async function generateCompletion(prompt: string, systemPrompt?: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new AppError("AI_ERROR", 502, "AI service unavailable")
  }

  const data = await response.json()
  return data.content[0].text
}

// Streaming pattern for chat
async function streamCompletion(messages: Message[]) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { /* ... */ },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages,
      stream: true,
    }),
  })

  return response.body // Return stream to client
}
```

---

## 10. SMS and Notifications

### Push Notification Pattern

```typescript
// Web Push (service worker based)
import webpush from "web-push"

webpush.setVapidDetails(
  "mailto:admin@yourapp.com",
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
)

async function sendPushNotification(userId: string, title: string, body: string) {
  const subscriptions = await db.pushSubscription.findMany({ where: { userId } })

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        sub.subscription,
        JSON.stringify({ title, body, url: "/notifications" })
      ).catch(async (error) => {
        if (error.statusCode === 410) {
          // Subscription expired — clean up
          await db.pushSubscription.delete({ where: { id: sub.id } })
        }
      })
    )
  )
}
```
