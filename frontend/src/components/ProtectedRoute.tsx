import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

interface Props {
  children: ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const access = useAuthStore((s) => s.access)
  const location = useLocation()
  if (!access) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
