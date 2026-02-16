import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build on Vercel, environment variables might not be available
  // Create a dummy client that will be replaced at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    // Always create a dummy client if env vars are missing
    // This allows the build to succeed, but API calls will fail at runtime
    // which is the desired behavior - users will see errors if env vars are not set
    const dummyClient = createClient('https://placeholder.supabase.co', 'placeholder-key')
    supabaseClient = dummyClient
    return dummyClient
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