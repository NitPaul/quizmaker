import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar_url: string
  date_joined: string
}

interface AuthState {
  access: string | null
  refresh: string | null
  user: User | null
  setTokens: (tokens: { access: string; refresh: string }) => void
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: null,
      setTokens: ({ access, refresh }) => set({ access, refresh }),
      setUser: (user) => set({ user }),
      logout: () => set({ access: null, refresh: null, user: null }),
    }),
    { name: 'quizmaker-auth' },
  ),
)
