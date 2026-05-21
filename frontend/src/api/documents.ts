import { api } from './client'

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface Document {
  id: number
  title: string
  status: DocumentStatus
  page_count: number
  chunk_count: number
  error_message: string
  created_at: string
}

export interface UploadResponse {
  document: Document
  task_id: string
}

interface PaginatedDocuments {
  count: number
  next: string | null
  previous: string | null
  results: Document[]
}

export async function fetchDocuments(): Promise<Document[]> {
  const { data } = await api.get<Document[] | PaginatedDocuments>('/documents/')
  if (Array.isArray(data)) return data
  return data.results ?? []
}

export async function fetchDocument(id: number): Promise<Document> {
  const { data } = await api.get<Document>(`/documents/${id}/`)
  return data
}

export async function uploadDocument(file: File, title: string): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  if (title) formData.append('title', title)
  const { data } = await api.post<UploadResponse>('/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/documents/${id}/`)
}
