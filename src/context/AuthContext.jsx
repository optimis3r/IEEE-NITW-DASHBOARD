import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

/**
 * Provides session + profile + RBAC helpers to the whole app.
 *
 * RBAC contract (mirrors the RLS policies in supabase/schema.sql):
 *   role === 'super_admin' -> everything, incl. user provisioning
 *   role === 'admin'       -> write access to operational modules
 *   role === 'member'      -> read-only; UIs must check canEdit before
 *                             rendering any create/edit/delete control.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('Failed to load profile:', error.message)
      return null
    }
    return data
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return
      setSession(session)
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        if (active) setProfile(p)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return
      setSession(session)
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        if (active) setProfile(p)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const role = profile?.role ?? null
  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role,
    isSuperAdmin: role === 'super_admin',
    isAdmin: role === 'admin' || role === 'super_admin',
    /** True when the user may create/edit/delete in operational modules. */
    canEdit: role === 'admin' || role === 'super_admin',
    loading,
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    refreshProfile: async () => {
      if (session?.user) setProfile(await fetchProfile(session.user.id))
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
