import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from './api'

interface User {
  uuid: string
  username: string
  role: 'ADMIN' | 'GURU' | 'SISWA'
  profile: any
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User, token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await api.post('/auth/login', {
            username,
            password,
          })

          const { accessToken, user } = response.data

          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('user', JSON.stringify(user))

          set({
            user,
            accessToken,
            isAuthenticated: true,
          })
        } catch (error) {
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
      },

      setUser: (user: User, token: string) => {
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
        })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
