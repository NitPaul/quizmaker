import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const { access } = useAuthStore.getState()
  if (access && config.headers) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refresh, setTokens, logout } = useAuthStore.getState()
  if (!refresh) return null
  try {
    const res = await axios.post(`${baseURL}/api/v1/auth/refresh/`, { refresh })
    const newAccess: string = res.data.access
    const newRefresh: string = res.data.refresh ?? refresh
    setTokens({ access: newAccess, refresh: newRefresh })
    return newAccess
  } catch {
    logout()
    return null
  }
}

type Retriable = InternalAxiosRequestConfig & { _retried?: boolean }

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as Retriable | undefined
    const isAuthEndpoint = original?.url?.includes('/auth/')
    if (error.response?.status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true
      refreshing ??= refreshAccessToken()
      const newAccess = await refreshing
      refreshing = null
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)
