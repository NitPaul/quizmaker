import { api } from './client'

export interface LeaderboardEntry {
  rank: number
  user_id: number
  user_email: string
  user_display_name: string
  score: number
  total: number
  percentage: number
  duration_seconds: number
  finished_at: string
  is_you: boolean
}

export interface Leaderboard {
  quiz_id: number
  quiz_title: string
  top: LeaderboardEntry[]
  you: LeaderboardEntry | null
}

export async function fetchLeaderboard(quizId: number): Promise<Leaderboard> {
  const { data } = await api.get<Leaderboard>(`/quizzes/${quizId}/leaderboard/`)
  return data
}
