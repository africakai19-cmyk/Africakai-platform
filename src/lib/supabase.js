import { createClient } from '@supabase/supabase-js'

// These will be set in environment variables on Vercel
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Auth Helpers ──────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch full employee profile with role
  const { data: profile } = await supabase
    .from('employees')
    .select('*, department:departments(*), division:divisions(*)')
    .eq('auth_user_id', user.id)
    .single()

  return profile
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  if (error) throw error
}
