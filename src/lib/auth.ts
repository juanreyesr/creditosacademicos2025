import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) console.warn(error)
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { session, user: session?.user ?? null, loading }
}

export async function signOutSafely() {
  try {
    await supabase.auth.signOut()
  } catch (e) {
    console.warn(e)
  }
}

export async function getIsAdmin(user: User) {
  const { data, error } = await supabase
    .from('perfiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.warn('No se pudo leer perfiles.is_admin:', error.message)
    return false
  }
  return !!data?.is_admin
}
