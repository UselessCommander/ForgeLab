import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ FEJL: Supabase environment variabler mangler!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Sat' : '❌ Mangler');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Sat' : '❌ Mangler');
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.')
  }

  // Only cache client if we have valid env vars
  if (supabaseClient) {
    return supabaseClient
  }

  const client = createClient(supabaseUrl, supabaseAnonKey)
  supabaseClient = client
  return client
}

// Export as a Proxy to maintain the same API while lazy-loading
// The Proxy only gets evaluated when properties are accessed, not during module load
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    try {
      const client = getSupabaseClient()
      const value = client[prop as keyof SupabaseClient]
      if (typeof value === 'function') {
        return value.bind(client)
      }
      return value
    } catch (error) {
      // If there's an error getting the client, return a no-op function
      // This prevents build-time errors
      if (typeof prop === 'string' && prop.includes('from')) {
        return () => ({
          select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
          insert: () => ({ select: () => ({ single: () => ({ data: null, error: { message: 'Missing Supabase environment variables' } }) }) }),
          update: () => ({ eq: () => ({ data: null, error: { message: 'Missing Supabase environment variables' } }) }),
          delete: () => ({ eq: () => ({ error: { message: 'Missing Supabase environment variables' } }) })
        })
      }
      throw error
    }
  }
}) as SupabaseClient