import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isConfigured: boolean
}

const configured = isSupabaseConfigured()

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  // Initialise loading lazily so demo mode never enters the loading state
  // and we don't have to call setLoading(false) inside an effect.
  const [loading, setLoading] = useState(() => configured)

  useEffect(() => {
    if (!configured) return

    let unsubscribed = false

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (unsubscribed) return
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen to auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      unsubscribed = true
      subscription.unsubscribe()
    }
  }, [])

  return { user, session, loading, isConfigured: configured }
}
