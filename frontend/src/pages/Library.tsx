import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  deleteDocument,
  fetchDocuments,
  uploadDocument,
  type Document,
} from '../api/documents'

export function Library() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: documents = [], error: listError } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    refetchInterval: (query) => {
      const docs = query.state.data
      if (!docs) return false
      const hasPending = docs.some(
        (d) => d.status === 'pending' || d.status === 'processing',
      )
      return hasPending ? 2000 : false
    },
  })

  const uploadMutation = useMutation({
    mutationFn: () => uploadDocument(file!, title),
    onSuccess: () => {
      setFile(null)
      setTitle('')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const uploadError = uploadMutation.isError
    ? axios.isAxiosError(uploadMutation.error)
      ? formatApiError(uploadMutation.error.response?.data)
      : 'Upload failed.'
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <Link
          to="/"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          &larr; Back to home
        </Link>
        <h1
          className="mt-2 text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          PDF Library
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Upload PDFs and generate quizzes grounded in their content using RAG.
        </p>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-lg font-semibold">Upload a PDF</h2>
        <div>
          <label className="block text-sm font-medium mb-2">
            PDF file (max 20 MB)
          </label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 dark:file:bg-emerald-900/50 file:text-emerald-700 dark:file:text-emerald-300 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900"
          />
        </div>
        <div>
          <label htmlFor="doc-title" className="block text-sm font-medium mb-2">
            Title (optional, defaults to filename)
          </label>
          <input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={file?.name ?? 'My document'}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          type="button"
          onClick={() => uploadMutation.mutate()}
          disabled={!file || uploadMutation.isPending}
          className="w-full rounded-lg bg-emerald-600 text-white font-semibold py-2.5 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Upload and ingest'}
        </button>
        {uploadError && (
          <p
            role="alert"
            className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2"
          >
            {uploadError}
          </p>
        )}
        <p className="text-xs text-slate-500">
          Ingestion runs in the background: pdfplumber extracts text, LangChain splits it
          into chunks, and Gemini generates 768-dim embeddings stored in pgvector. Watch the
          status badge update live.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <h2 className="text-lg font-semibold">Your documents</h2>
          {documents.length > 0 && (
            <span className="text-sm text-slate-500">
              {documents.length} document{documents.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        {listError && (
          <p
            role="alert"
            className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2"
          >
            Failed to load documents.
          </p>
        )}
        {documents.length === 0 && !listError ? (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500">
              No documents yet. Upload one above to get started.
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              onDelete={() => {
                if (confirm(`Delete "${doc.title}"? This cannot be undone.`)) {
                  deleteMutation.mutate(doc.id)
                }
              }}
              onGenerate={() => navigate(`/quizzes/new-rag?document=${doc.id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface RowProps {
  document: Document
  onDelete: () => void
  onGenerate: () => void
}

function DocumentRow({ document, onDelete, onGenerate }: RowProps) {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{document.title}</p>
        <p className="text-xs text-slate-500 mt-1">
          {document.status === 'ready' &&
            `${document.page_count} pages · ${document.chunk_count} chunks · `}
          {new Date(document.created_at).toLocaleDateString()}
        </p>
        {document.status === 'failed' && document.error_message && (
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
            {document.error_message}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
        <StatusBadge status={document.status} />
        {document.status === 'ready' && (
          <button
            type="button"
            onClick={onGenerate}
            className="rounded-lg px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Generate quiz
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Document['status'] }) {
  const classes: Record<Document['status'], string> = {
    pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    processing:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse',
    ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    failed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  }
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded capitalize ${classes[status]}`}
    >
      {status}
    </span>
  )
}

function formatApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Upload failed.'
  const obj = data as Record<string, unknown>
  if (typeof obj.detail === 'string') return obj.detail
  const messages: string[] = []
  for (const [field, value] of Object.entries(obj)) {
    const text = Array.isArray(value) ? value.join(', ') : String(value)
    messages.push(`${field}: ${text}`)
  }
  return messages.join(' — ') || 'Upload failed.'
}
