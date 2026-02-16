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
    supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key') as any
    return supabaseClient
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

// Export as a Proxy to maintain the same API while lazy-loading
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof SupabaseClient]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
}) as SupabaseClient