import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AiBuilder } from './pages/AiBuilder'
import { History } from './pages/History'
import { Home } from './pages/Home'
import { Leaderboard } from './pages/Leaderboard'
import { Library } from './pages/Library'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { QuizBuilder } from './pages/QuizBuilder'
import { QuizPlayer } from './pages/QuizPlayer'
import { RagBuilder } from './pages/RagBuilder'
import { Register } from './pages/Register'
import { Results } from './pages/Results'
import { useThemeStore } from './store/theme'

export default function App() {
  const applyOnMount = useThemeStore((s) => s.applyOnMount)
  useEffect(() => {
    applyOnMount()
  }, [applyOnMount])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/new"
          element={
            <ProtectedRoute>
              <QuizBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/new-ai"
          element={
            <ProtectedRoute>
              <AiBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/new-rag"
          element={
            <ProtectedRoute>
              <RagBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:id/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:id/play"
          element={
            <ProtectedRoute>
              <QuizPlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:id/results/:attemptId"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
