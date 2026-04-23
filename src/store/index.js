import { create } from 'zustand'
import { supabase, signIn, signOut, getCurrentUser } from '../lib/supabase'
import { PERMISSIONS } from '../lib/roles'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  role: null,
  permissions: null,
  loading: true,
  error: null,

  // ─── Initialize ────────────────────────────────────────────────────────────
  init: async () => {
    set({ loading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const profile = await getCurrentUser()
        if (profile) {
          set({
            user: session.user,
            profile,
            role: profile.role,
            permissions: PERMISSIONS[profile.role] || null,
            loading: false,
          })
        } else {
          set({ loading: false })
        }
      } else {
        set({ loading: false })
      }
    } catch (err) {
      set({ loading: false, error: err.message })
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const profile = await getCurrentUser()
        set({
          user: session.user,
          profile,
          role: profile?.role,
          permissions: profile ? PERMISSIONS[profile.role] : null,
        })
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, role: null, permissions: null })
      }
    })
  },

  // ─── Sign In ───────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      await signIn(email, password)
      // Auth state listener handles the rest
      set({ loading: false })
    } catch (err) {
      set({ loading: false, error: err.message })
      throw err
    }
  },

  // ─── Sign Out ──────────────────────────────────────────────────────────────
  logout: async () => {
    await signOut()
    set({ user: null, profile: null, role: null, permissions: null })
  },

  clearError: () => set({ error: null }),
}))

// ─── App State Store ───────────────────────────────────────────────────────────
export const useAppStore = create((set) => ({
  sidebarOpen: true,
  activeModule: 'dashboard',
  notifications: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveModule: (module) => set({ activeModule: module }),
  addNotification: (notif) => set((s) => ({
    notifications: [{ id: Date.now(), ...notif }, ...s.notifications].slice(0, 50)
  })),
  clearNotification: (id) => set((s) => ({
    notifications: s.notifications.filter(n => n.id !== id)
  })),
}))
