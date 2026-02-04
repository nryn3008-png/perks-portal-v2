import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client with service role key
 * Bypasses RLS policies - use only on server-side
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a fresh Supabase client instance
 * Use this when you need to ensure no connection/query caching
 */
export function createSupabaseAdmin(): SupabaseClient {
  return createClient(
    supabaseUrl,
    supabaseServiceKey || supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Default singleton for backward compatibility
// Note: In serverless, this may persist across warm invocations
export const supabaseAdmin = createSupabaseAdmin();
