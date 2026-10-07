import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

function getClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Browser client (singleton)
let _supabase: ReturnType<typeof getClient> | null = null
export const supabase = new Proxy({} as ReturnType<typeof getClient>, {
  get(_, prop) {
    if (!_supabase) _supabase = getClient()
    return (_supabase as any)[prop]
  },
})

// Server client (new instance per call, safe for SSR)
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Auth helpers
export async function signIn(email: string, password: string) {
  return getClient().auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return getClient().auth.signOut()
}

export async function getSession() {
  const { data } = await getClient().auth.getSession()
  return data.session
}
