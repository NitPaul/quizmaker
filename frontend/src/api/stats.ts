import { api } from './client'

export interface UserStats {
  quizzes_count: number
  attempts_count: number
  documents_count: number
  total_correct: number
  total_questions: number
  avg_percentage: number
  best_percentage: number
}

export async function fetchUserStats(): Promise<UserStats> {
  const { data } = await api.get<UserStats>('/auth/me/stats/')
  return data
}
