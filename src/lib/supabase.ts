import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[VibeNovel] Supabase env vars not found. Running in offline/demo mode.\n' +
      'Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

const _client = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

/**
 * The strictly-typed Supabase client. The handcrafted `Database` type in
 * `database.types.ts` is comprehensive but its strict generic chaining
 * interacts awkwardly with the current TypeScript build (table builders
 * collapse to `never` at insert/update sites). For the storefront CRUD
 * layer we re-export a loosely-typed wrapper so call sites can keep their
 * own row-shape assertions without fighting the Supabase generics.
 *
 * Strict access remains available via `supabaseStrict` for code paths that
 * benefit from full row inference (e.g. analytics queries).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, 'public'> = _client as unknown as SupabaseClient<any, 'public'>
export const supabaseStrict = _client

export const isSupabaseConfigured = () =>
  Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  )
