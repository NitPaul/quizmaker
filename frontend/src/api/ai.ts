import { api } from './client'

export type AiProvider = 'groq' | 'gemini'

export interface GenerateQuizPayload {
  text: string
  num_questions: number
  title?: string
  provider?: AiProvider
  api_key?: string
}

export interface GenerateFromDocumentPayload {
  document_id: number
  topic: string
  num_questions: number
  title?: string
  provider?: AiProvider
  api_key?: string
}

export interface EnqueueResponse {
  task_id: string
  status_url: string
}

export async function enqueueGenerateQuiz(payload: GenerateQuizPayload): Promise<EnqueueResponse> {
  const { data } = await api.post<EnqueueResponse>('/ai/generate/', payload)
  return data
}

export async function enqueueGenerateFromDocument(
  payload: GenerateFromDocumentPayload,
): Promise<EnqueueResponse> {
  const { data } = await api.post<EnqueueResponse>('/ai/generate-from-document/', payload)
  return data
}
