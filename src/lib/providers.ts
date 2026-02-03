import { supabaseAdmin } from './supabase-server'

interface Provider {
  id: string
  name: string
  slug: string
  api_url: string
  api_token: string
  is_active: boolean
  is_default: boolean
}

export async function getDefaultProvider(): Promise<Provider | null> {
  const { data, error } = await supabaseAdmin
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

export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const { data, error } = await supabaseAdmin
    .from('providers')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Failed to get provider:', error)
    return null
  }
  return data
}
