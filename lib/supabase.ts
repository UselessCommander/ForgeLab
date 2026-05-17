import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null
let hasWarnedMissingEnv = false
let hasWarnedMissingServiceRole = false

/** Server routes should use service role (bypasses RLS after migration 022). Browser uses anon. */
function resolveSupabaseApiKey(anonKey: string): string {
  const isServer = typeof window === 'undefined'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (isServer && serviceKey) return serviceKey
  if (isServer && process.env.NODE_ENV === 'production' && !hasWarnedMissingServiceRole) {
    console.warn(
      'SUPABASE_SERVICE_ROLE_KEY mangler på serveren. API-ruter kan fejle efter RLS migration 022.'
    )
    hasWarnedMissingServiceRole = true
  }
  return anonKey
}

function createNoopQueryBuilder() {
  const self: any = {}
  self.select = () => self
  self.insert = () => self
  self.update = () => self
  self.delete = () => self
  self.upsert = () => self
  self.eq = () => self
  self.neq = () => self
  self.gte = () => self
  self.lte = () => self
  self.like = () => self
  self.ilike = () => self
  self.in = () => self
  self.order = () => self
  self.limit = () => self
  self.range = () => self
  self.single = async () => ({ data: null, error: null })
  self.maybeSingle = async () => ({ data: null, error: null })
  self.then = (resolve: (v: any) => any) => Promise.resolve({ data: null, error: null }).then(resolve)
  return self
}

function createNoopChannel() {
  return {
    on: () => createNoopChannel(),
    send: async () => ({ status: 'ok' }),
    track: async () => ({ status: 'ok' }),
    presenceState: () => ({}),
    subscribe: (cb?: (status: string) => void) => {
      cb?.('SUBSCRIBED')
      return createNoopChannel()
    },
    unsubscribe: async () => ({ status: 'ok' }),
  }
}

function createMockSupabaseClient(): SupabaseClient {
  const mock: any = {
    from: () => createNoopQueryBuilder(),
    rpc: async () => ({ data: null, error: null }),
    channel: () => createNoopChannel(),
    removeChannel: async () => ({ data: null, error: null }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }

  return new Proxy(mock, {
    get(target, prop) {
      if (prop in target) return target[prop as keyof typeof target]
      return () => createNoopQueryBuilder()
    },
  }) as SupabaseClient
}

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    const isLocalDev = process.env.NODE_ENV !== 'production'
    if (isLocalDev) {
      if (!hasWarnedMissingEnv) {
        console.warn('Supabase env mangler i localhost. Kører i mock/no-op mode.')
        console.warn('Til rigtig login: sæt NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY i .env.local (samme som Vercel), genstart npm run dev.')
        console.warn('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Sat' : 'Mangler')
        console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Sat' : 'Mangler')
        hasWarnedMissingEnv = true
      }
      if (!supabaseClient) supabaseClient = createMockSupabaseClient()
      return supabaseClient
    }
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  // Only cache client if we have valid env vars
  if (supabaseClient) {
    return supabaseClient
  }

  const apiKey = resolveSupabaseApiKey(supabaseAnonKey)
  const client = createClient(supabaseUrl, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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