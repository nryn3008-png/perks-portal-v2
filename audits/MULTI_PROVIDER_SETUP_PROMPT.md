# Multi-Provider Setup Prompt

Copy and paste this prompt into Claude Code:

---

```
Set up multi-provider support for the Perks Portal to store API credentials in Supabase instead of environment variables.

## Context

We have two GetProven accounts:
1. **Super Admin** - Original GetProven admin API (keep for admin/sync purposes)
2. **Bridge Perks** - New Bridge-specific API at bridge.getproven.com (use as default for portal)

## Step 1: Create Supabase Table

Create a `providers` table in Supabase. Run this SQL in the Supabase SQL editor:

```sql
-- Providers table for storing API credentials
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- API Configuration
  api_type TEXT NOT NULL DEFAULT 'getproven',
  api_url TEXT NOT NULL,
  api_token TEXT NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure only one default provider
CREATE UNIQUE INDEX idx_providers_single_default
ON providers (is_default)
WHERE is_default = true;

-- Index for active providers
CREATE INDEX idx_providers_active ON providers(is_active) WHERE is_active = true;

-- RLS policies
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read providers (but not tokens)
CREATE POLICY "Users can view provider names"
  ON providers FOR SELECT
  TO authenticated
  USING (true);

-- Create a secure view that hides tokens
CREATE VIEW providers_public AS
SELECT
  id, name, slug, description, api_type,
  is_active, is_default, created_at, updated_at
FROM providers;
```

## Step 2: Insert Provider Records

After creating the table, insert both providers. Run this SQL (replace with actual values):

```sql
-- Insert Super Admin (existing GetProven admin)
INSERT INTO providers (name, slug, description, api_type, api_url, api_token, is_active, is_default)
VALUES (
  'GetProven Admin',
  'getproven-admin',
  'Super admin API for syncing and management',
  'getproven',
  'https://api.getproven.com/api/v1',  -- Current GETPROVEN_API_URL from .env
  'YOUR_EXISTING_ADMIN_TOKEN',          -- Current GETPROVEN_API_TOKEN from .env
  true,
  false  -- Not default, just for admin use
);

-- Insert Bridge Perks (new account)
INSERT INTO providers (name, slug, description, api_type, api_url, api_token, is_active, is_default)
VALUES (
  'Bridge Perks',
  'bridge-perks',
  'Bridge portfolio perks - main provider for the portal',
  'getproven',
  'https://bridge.getproven.com/api/ext/v1',  -- New Bridge API URL
  'YOUR_NEW_BRIDGE_API_TOKEN',                 -- Token from the email
  true,
  true   -- This is the default for the portal
);
```

## Step 3: Create Provider Service

Create a new file `src/lib/providers.ts`:

```typescript
import { supabase } from './supabase'

export interface Provider {
  id: string
  name: string
  slug: string
  description: string | null
  api_type: string
  api_url: string
  api_token: string
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ProviderPublic {
  id: string
  name: string
  slug: string
  description: string | null
  api_type: string
  is_active: boolean
  is_default: boolean
}

/**
 * Get the default active provider (for portal use)
 */
export async function getDefaultProvider(): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Failed to get default provider:', error)
    return null
  }

  return data
}

/**
 * Get a provider by slug
 */
export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error(`Failed to get provider ${slug}:`, error)
    return null
  }

  return data
}

/**
 * Get all active providers (public info only, no tokens)
 */
export async function getActiveProviders(): Promise<ProviderPublic[]> {
  const { data, error } = await supabase
    .from('providers_public')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false })

  if (error) {
    console.error('Failed to get providers:', error)
    return []
  }

  return data || []
}

/**
 * Get provider for admin operations (super admin)
 */
export async function getAdminProvider(): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('slug', 'getproven-admin')
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Failed to get admin provider:', error)
    return null
  }

  return data
}
```

## Step 4: Update GetProven Client

Modify `src/lib/api/getproven-client.ts` to accept dynamic config:

```typescript
import { Provider } from '../providers'

interface GetProvenConfig {
  apiUrl: string
  apiToken: string
}

/**
 * Create a GetProven API client with the given config
 */
export function createGetProvenClient(config: GetProvenConfig) {
  const { apiUrl, apiToken } = config

  async function fetchFromGetProven<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${apiUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`GetProven API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  return {
    // Perks/Offers
    async getOffers(params?: Record<string, string>) {
      const query = params ? `?${new URLSearchParams(params)}` : ''
      return fetchFromGetProven(`/offers/${query}`)
    },

    async getOffer(id: string) {
      return fetchFromGetProven(`/offers/${id}/`)
    },

    // Vendors
    async getVendors(params?: Record<string, string>) {
      const query = params ? `?${new URLSearchParams(params)}` : ''
      return fetchFromGetProven(`/vendors/${query}`)
    },

    async getVendor(id: string) {
      return fetchFromGetProven(`/vendors/${id}/`)
    },

    // Categories/Filters
    async getCategories() {
      return fetchFromGetProven('/categories/')
    },

    // Raw fetch for custom endpoints
    fetch: fetchFromGetProven,
  }
}

/**
 * Create client from a Provider record
 */
export function createClientFromProvider(provider: Provider) {
  return createGetProvenClient({
    apiUrl: provider.api_url,
    apiToken: provider.api_token,
  })
}
```

## Step 5: Update API Routes

Update `src/app/api/perks/route.ts` to use the provider system:

```typescript
import { NextResponse } from 'next/server'
import { getDefaultProvider } from '@/lib/providers'
import { createClientFromProvider } from '@/lib/api/getproven-client'

export async function GET(request: Request) {
  try {
    // Get the default provider (Bridge Perks)
    const provider = await getDefaultProvider()

    if (!provider) {
      return NextResponse.json(
        { error: { code: 'NO_PROVIDER', message: 'No active provider configured' } },
        { status: 503 }
      )
    }

    // Create client for this provider
    const client = createClientFromProvider(provider)

    // Get query params
    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = {}

    searchParams.forEach((value, key) => {
      params[key] = value
    })

    // Fetch offers
    const data = await client.getOffers(params)

    return NextResponse.json({
      data,
      meta: {
        provider: {
          id: provider.id,
          name: provider.name,
          slug: provider.slug,
        }
      }
    })

  } catch (error) {
    console.error('Failed to fetch perks:', error)
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch perks' } },
      { status: 500 }
    )
  }
}
```

## Step 6: Update Other API Routes

Apply the same pattern to other routes that use GetProven:
- `src/app/api/perks/[id]/route.ts`
- `src/app/api/perks/filters/route.ts`
- `src/app/api/vendors/route.ts`
- `src/app/api/vendors/[id]/route.ts`

For admin/sync routes, use `getAdminProvider()` instead of `getDefaultProvider()`.

## Step 7: Add Admin Provider Management (Optional)

Create `src/app/api/providers/route.ts` for admin to list/manage providers:

```typescript
import { NextResponse } from 'next/server'
import { getActiveProviders } from '@/lib/providers'

// GET /api/providers - List providers (public info only)
export async function GET() {
  try {
    const providers = await getActiveProviders()
    return NextResponse.json({ data: providers })
  } catch (error) {
    console.error('Failed to fetch providers:', error)
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch providers' } },
      { status: 500 }
    )
  }
}
```

## Step 8: Environment Variables Cleanup

After everything is working, you can optionally keep the env vars as fallback:

```bash
# .env.local - Keep as fallback, but DB is primary
GETPROVEN_API_URL=https://bridge.getproven.com/api/ext/v1
GETPROVEN_API_TOKEN=your_bridge_token

# Add a flag to use DB providers
USE_DB_PROVIDERS=true
```

## Step 9: Test the Setup

1. Verify providers are in the database:
   ```sql
   SELECT name, slug, is_default, is_active FROM providers;
   ```

2. Test the API:
   ```bash
   curl http://localhost:3002/api/perks
   ```

3. Check the response includes provider info in meta.

## Summary

After this setup:
- **Bridge Perks** (bridge.getproven.com) = Default provider for portal users
- **GetProven Admin** (api.getproven.com) = Admin provider for sync operations
- Credentials stored securely in Supabase, not in .env
- Easy to add more providers in the future

Show me the implementation and confirm it's working.
```
