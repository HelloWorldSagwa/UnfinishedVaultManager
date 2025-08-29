import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a placeholder client for build time
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not set. Using placeholder client.')
    // Return a mock client for build time
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
      }),
      auth: {
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'No Supabase URL configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: null, error: null }),
        onAuthStateChange: () => ({ data: null, error: null, unsubscribe: () => {} }),
      },
      rpc: () => Promise.resolve({ data: null, error: null }),
    } as any
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  })
}

export const supabase = createSupabaseClient()

export default supabase