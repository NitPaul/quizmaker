import { api } from './client'

export type QuizSource = 'csv' | 'ai_text' | 'ai_rag'
export type AttemptMode = 'flashcard' | 'exam'

export interface QuestionInput {
  text: string
  correct_answer: string
  options: string[]
}

export interface CreateQuizPayload {
  title: string
  source: QuizSource
  randomness: number
  questions: QuestionInput[]
}

export interface Question {
  id: number
  position: number
  text: string
  correct_answer: string
  options: string[]
}

export interface Quiz {
  id: number
  title: string
  source: QuizSource
  randomness: number
  questions: Question[]
  created_at: string
}

export interface AnswerInput {
  question_id: number
  user_answer: string
}

export interface SubmitAttemptPayload {
  mode: AttemptMode
  duration_seconds: number
  answers: AnswerInput[]
}

export interface AttemptAnswer {
  question: number
  user_answer: string
  is_correct: boolean
}

export interface Attempt {
  id: number
  quiz: number
  quiz_title?: string
  mode: AttemptMode
  score: number
  total: number
  percentage: number
  duration_seconds: number
  finished_at: string
  answers: AttemptAnswer[]
}

export async function createQuiz(payload: CreateQuizPayload): Promise<Quiz> {
  const { data } = await api.post<Quiz>('/quizzes/', payload)
  return data
}

export async function fetchQuiz(id: number): Promise<Quiz> {
  const { data } = await api.get<Quiz>(`/quizzes/${id}/`)
  return data
}

export async function submitAttempt(
  quizId: number,
  payload: SubmitAttemptPayload,
): Promise<Attempt> {
  const { data } = await api.post<Attempt>(`/quizzes/${quizId}/attempts/`, payload)
  return data
}

export async function fetchAttempt(id: number): Promise<Attempt> {
  const { data } = await api.get<Attempt>(`/attempts/${id}/`)
  return data
}
