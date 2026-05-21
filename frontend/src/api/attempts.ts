import { api } from './client'
import type { Attempt } from './quizzes'

export interface AttemptListItem extends Omit<Attempt, 'answers'> {
  quiz_title: string
}

interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function fetchAttempts(quizId?: number): Promise<AttemptListItem[]> {
  const params = quizId ? `?quiz=${quizId}` : ''
  const { data } = await api.get<AttemptListItem[] | Paginated<AttemptListItem>>(
    `/attempts/${params}`,
  )
  if (Array.isArray(data)) return data
  return data.results ?? []
}
