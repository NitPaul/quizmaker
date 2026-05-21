import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { fetchMe, login } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { Marketing } from '../components/Marketing'

interface LocationState {
  from?: { pathname?: string }
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  const mutation = useMutation({
    mutationFn: async () => {
      const tokens = await login({ email, password })
      setTokens(tokens)
      const user = await fetchMe()
      setUser(user)
    },
    onSuccess: () => {
      const from = (location.state as LocationState | null)?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    },
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  const errorMessage = axios.isAxiosError(mutation.error)
    ? (mutation.error.response?.data?.detail ?? 'Login failed. Check your credentials.')
    : null

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-8rem)]">
      <Marketing />
      <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
        <h1
          className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Sign in
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mt-1">
          Welcome back to QuizMaker.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {errorMessage && (
            <p
              role="alert"
              className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2"
            >
              {errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-2.5 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {mutation.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          No account?{' '}
          <Link
            to="/register"
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
