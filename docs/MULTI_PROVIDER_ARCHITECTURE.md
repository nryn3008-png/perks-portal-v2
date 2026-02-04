# Multi-Provider Architecture Plan

## Overview

Enable the Perks Portal to support multiple perk providers (GetProven accounts, customer accounts, etc.) with the ability to switch between them or aggregate offers from all providers.

---

## Current State

```
┌─────────────────┐      ┌─────────────────┐
│  Perks Portal   │ ───▶ │   GetProven     │
│   (Frontend)    │      │   (Single API)  │
└─────────────────┘      └─────────────────┘
        │
        ▼
   .env.local
   GETPROVEN_API_TOKEN=xxx
   GETPROVEN_API_URL=xxx
```

**Limitations:**
- Single hardcoded provider
- Can't switch accounts
- Can't add customer providers
- Credentials in environment variables

---

## Proposed Architecture

```
┌─────────────────┐      ┌─────────────────┐
│  Perks Portal   │      │    Supabase     │
│   (Frontend)    │ ───▶ │   (Database)    │
└─────────────────┘      └─────────────────┘
        │                        │
        │                        ▼
        │               ┌─────────────────┐
        │               │    providers    │
        │               │ ─────────────── │
        │               │ id              │
        │               │ name            │
        │               │ api_url         │
        │               │ api_token (enc) │
        │               │ is_active       │
        │               │ is_default      │
        │               └─────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│              Provider Router                 │
│  ─────────────────────────────────────────  │
│  GET /api/perks?provider=xxx                │
│  GET /api/perks (uses active/default)       │
│  GET /api/providers (list all)              │
│  POST /api/providers (add new)              │
│  PATCH /api/providers/:id/activate          │
└─────────────────────────────────────────────┘
        │
        ▼
┌───────────┬───────────┬───────────┐
│ GetProven │ GetProven │  Future   │
│  (Admin)  │  (Perk)   │ Provider  │
└───────────┴───────────┴───────────┘
```

---

## Provider Display Options

### Option A: Switch Between Providers

Users see perks from ONE active provider at a time. Admin switches the active provider.

```
┌─────────────────────────────────────────────┐
│  Admin Dashboard                             │
│  ┌─────────────────────────────────────────┐│
│  │ Active Provider: [GetProven Admin ▼]    ││
│  │                                         ││
│  │  ○ GetProven Admin (current)            ││
│  │  ○ Perk Account                         ││
│  │  ○ Customer X                           ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

**Pros:**
- Simple mental model
- Clear data separation
- Easy to demo specific providers

**Cons:**
- Users only see one catalog at a time
- Need to switch to see all offers

---

### Option B: Aggregate All Providers

Combine perks from all active providers into one unified catalog.

```
┌─────────────────────────────────────────────┐
│  Perks Catalog (Aggregated)                 │
│  ┌─────────────┐ ┌─────────────┐            │
│  │ AWS Credits │ │ Notion Pro  │            │
│  │ GetProven   │ │ Perk Acct   │            │
│  └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌─────────────┐            │
│  │ Stripe Fee  │ │ HubSpot     │            │
│  │ Customer X  │ │ GetProven   │            │
│  └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────┘
```

**Pros:**
- Users see everything in one place
- Maximizes visible value
- No switching needed

**Cons:**
- May have duplicate perks across providers
- Need deduplication logic
- Provider attribution needed on cards

---

### Option C: Both (Recommended)

Admin chooses display mode: Single Provider OR Aggregated.

```
┌─────────────────────────────────────────────┐
│  Admin Settings                              │
│  ┌─────────────────────────────────────────┐│
│  │ Display Mode:                           ││
│  │  ○ Single Provider (select one)         ││
│  │  ● Aggregate All Active Providers       ││
│  │                                         ││
│  │ Active Providers:                       ││
│  │  ☑ GetProven Admin                      ││
│  │  ☑ Perk Account                         ││
│  │  ☐ Customer X (disabled)                ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

## Database Schema

### New Tables

```sql
-- Providers table
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "GetProven Admin", "Perk Account"
  slug TEXT UNIQUE NOT NULL,             -- "getproven-admin", "perk-account"
  description TEXT,                      -- Optional description

  -- API Configuration
  api_type TEXT NOT NULL DEFAULT 'getproven',  -- 'getproven', 'custom', etc.
  api_url TEXT NOT NULL,                 -- Base API URL
  api_token TEXT NOT NULL,               -- Encrypted API token

  -- Status
  is_active BOOLEAN DEFAULT true,        -- Can be used
  is_default BOOLEAN DEFAULT false,      -- Default when none specified

  -- Display
  logo_url TEXT,                         -- Provider logo
  color TEXT,                            -- Brand color for attribution

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Settings table (for display mode, etc.)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default setting
INSERT INTO settings (key, value) VALUES
  ('provider_display_mode', '"aggregate"');  -- or "single"

-- RLS Policies
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Only admins can read provider tokens
CREATE POLICY "Admins can manage providers"
  ON providers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Index for quick lookups
CREATE INDEX idx_providers_active ON providers(is_active) WHERE is_active = true;
CREATE INDEX idx_providers_default ON providers(is_default) WHERE is_default = true;
```

### Migration from Environment Variables

```sql
-- Initial migration: Move existing GetProven config to database
INSERT INTO providers (
  name,
  slug,
  api_type,
  api_url,
  api_token,
  is_active,
  is_default
) VALUES (
  'GetProven Admin',
  'getproven-admin',
  'getproven',
  '${GETPROVEN_API_URL}',  -- From current .env
  '${GETPROVEN_API_TOKEN}', -- From current .env (will be encrypted)
  true,
  true
);
```

---

## API Changes

### New Endpoints

```typescript
// GET /api/providers
// List all providers (admin only, tokens masked)
{
  data: [
    {
      id: "uuid",
      name: "GetProven Admin",
      slug: "getproven-admin",
      api_type: "getproven",
      is_active: true,
      is_default: true,
      perk_count: 245  // Cached count
    },
    {
      id: "uuid",
      name: "Perk Account",
      slug: "perk-account",
      api_type: "getproven",
      is_active: true,
      is_default: false,
      perk_count: 180
    }
  ]
}

// POST /api/providers
// Add new provider (admin only)
{
  name: "Perk Account",
  api_url: "https://api.getproven.com/api/v1",
  api_token: "xxx",
  api_type: "getproven"
}

// PATCH /api/providers/:id
// Update provider (admin only)
{
  is_active: true,
  is_default: true
}

// DELETE /api/providers/:id
// Remove provider (admin only, soft delete)

// GET /api/settings/provider-display-mode
// Returns: "aggregate" | "single"

// PATCH /api/settings/provider-display-mode
// Set display mode (admin only)
{
  mode: "aggregate"  // or "single"
}
```

### Modified Endpoints

```typescript
// GET /api/perks
// Now accepts optional provider parameter
// Query params:
//   provider=slug     (specific provider)
//   provider=all      (aggregate all active)
//   (none)            (uses display mode setting)

// Response now includes provider attribution
{
  data: [
    {
      id: "perk-123",
      name: "AWS Credits",
      // ... other fields
      provider: {
        id: "uuid",
        name: "GetProven Admin",
        slug: "getproven-admin",
        color: "#0038FF"
      }
    }
  ],
  meta: {
    total: 425,
    providers: ["getproven-admin", "perk-account"]
  }
}
```

---

## File Structure Changes

```
src/
├── app/
│   └── api/
│       ├── providers/
│       │   ├── route.ts              # GET (list), POST (create)
│       │   └── [id]/
│       │       └── route.ts          # GET, PATCH, DELETE
│       ├── settings/
│       │   └── provider-display-mode/
│       │       └── route.ts          # GET, PATCH
│       └── perks/
│           └── route.ts              # Modified to support multi-provider
│
├── lib/
│   ├── api/
│   │   ├── provider-client.ts        # NEW: Factory for provider clients
│   │   ├── getproven-client.ts       # Modified: Takes config as param
│   │   └── provider-registry.ts      # NEW: Manages active providers
│   └── db/
│       └── providers.ts              # NEW: Provider CRUD operations
│
└── components/
    └── admin/
        ├── provider-switcher.tsx     # NEW: Provider dropdown
        ├── provider-manager.tsx      # NEW: Add/edit/remove providers
        └── provider-settings.tsx     # NEW: Display mode settings
```

---

## Implementation Phases

### Phase 1: Database Foundation
1. Create `providers` and `settings` tables in Supabase
2. Migrate existing GetProven credentials to database
3. Add encryption for API tokens
4. Create provider CRUD API endpoints

### Phase 2: Provider Abstraction
1. Refactor `getproven-client.ts` to accept dynamic config
2. Create `provider-client.ts` factory
3. Create `provider-registry.ts` for managing active providers
4. Modify `/api/perks` to use provider registry

### Phase 3: Admin UI
1. Build provider management page (`/admin/providers`)
2. Add provider switcher component
3. Add display mode settings
4. Add provider attribution to perk cards

### Phase 4: Aggregation Logic
1. Implement parallel fetching from multiple providers
2. Add deduplication logic (by perk name/vendor)
3. Add caching layer for aggregated results
4. Handle provider-specific error states

---

## Security Considerations

### Token Encryption

```typescript
// Use Supabase Vault or application-level encryption
import { encrypt, decrypt } from '@/lib/crypto'

// When storing
const encryptedToken = await encrypt(apiToken, process.env.ENCRYPTION_KEY)

// When using
const decryptedToken = await decrypt(provider.api_token, process.env.ENCRYPTION_KEY)
```

### Access Control

- Only admins can view/manage providers
- API tokens never exposed to frontend
- Provider list endpoint masks tokens
- Audit log for provider changes

---

## UI Mockups

### Provider Manager (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│  Providers                                    [+ Add Provider]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ● GetProven Admin                         245 perks    │ │
│  │   api.getproven.com                       DEFAULT      │ │
│  │                                    [Edit] [Deactivate] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ● Perk Account                            180 perks    │ │
│  │   api.getproven.com                       ACTIVE       │ │
│  │                                    [Edit] [Set Default]│ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ○ Customer X                              52 perks     │ │
│  │   api.getproven.com                       INACTIVE     │ │
│  │                                    [Edit] [Activate]   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Display Mode                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  ○ Single Provider    Show perks from one provider      ││
│  │  ● Aggregate          Combine all active providers      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Add Provider Modal

```
┌─────────────────────────────────────────────────┐
│  Add Provider                              [×]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Name                                           │
│  ┌───────────────────────────────────────────┐  │
│  │ Perk Account                              │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  API URL                                        │
│  ┌───────────────────────────────────────────┐  │
│  │ https://api.getproven.com/api/v1          │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  API Token                                      │
│  ┌───────────────────────────────────────────┐  │
│  │ ••••••••••••••••••••                      │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ☐ Set as default provider                      │
│                                                 │
│            [Cancel]  [Test Connection]  [Save]  │
└─────────────────────────────────────────────────┘
```

### Perk Card with Provider Attribution

```
┌─────────────────────────────────────┐
│  ┌─────┐                            │
│  │ AWS │  AWS Activate Credits      │
│  └─────┘                            │
│                                     │
│  $5,000 in AWS credits for         │
│  eligible startups...               │
│                                     │
│  ┌──────────────┐                   │
│  │ 🔵 GetProven │  ← Provider badge │
│  └──────────────┘                   │
│                        [Redeem →]   │
└─────────────────────────────────────┘
```

---

## Questions to Resolve

1. **Deduplication:** When aggregating, how to handle same perk from multiple providers?
   - Show both with provider attribution?
   - Show one (prefer default provider)?
   - Merge and show "available from X providers"?

2. **Sync frequency:** How often to refresh perk counts per provider?
   - On-demand when admin views providers?
   - Background job every N hours?

3. **Error handling:** If one provider's API is down during aggregation?
   - Show partial results with warning?
   - Cache last successful fetch?

4. **Customer providers:** Will customers have their own GetProven accounts, or a different API format?

---

## Next Steps

1. **Review this plan** - Does this match your vision?
2. **Answer open questions** above
3. **I'll create implementation prompts** for Claude Code
4. **Implement in phases** starting with database foundation

---

*Created for Perks Portal multi-provider support*
