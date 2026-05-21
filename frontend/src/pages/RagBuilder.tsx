import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { enqueueGenerateFromDocument, type AiProvider } from '../api/ai'
import { fetchDocuments } from '../api/documents'
import { pollTask, type TaskState } from '../api/tasks'
import type { AttemptMode } from '../api/quizzes'

export function RagBuilder() {
  const [params] = useSearchParams()
  const initialDocId = Number(params.get('document')) || null
  const [documentId, setDocumentId] = useState<number | null>(initialDocId)
  const [topic, setTopic] = useState('')
  const [num, setNum] = useState(10)
  const [title, setTitle] = useState('')
  const [provider, setProvider] = useState<AiProvider>('groq')
  const [useOwnKey, setUseOwnKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [taskState, setTaskState] = useState<TaskState | null>(null)
  const navigate = useNavigate()

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
  })

  const readyDocs = documents.filter((d) => d.status === 'ready')
  const selectedDoc = readyDocs.find((d) => d.id === documentId) ?? null

  const mutation = useMutation({
    mutationFn: async (mode: AttemptMode) => {
      if (documentId === null) throw new Error('Pick a document first.')
      setTaskState('PENDING')
      const { task_id } = await enqueueGenerateFromDocument({
        document_id: documentId,
        topic: topic.trim(),
        num_questions: num,
        title: title.trim() || undefined,
        provider,
        api_key: useOwnKey && apiKey.trim() ? apiKey.trim() : undefined,
      })
      const result = await pollTask<{ quiz_id: number; chunks_used: number }>(task_id, {
        intervalMs: 1500,
        onTick: setTaskState,
      })
      return { quizId: result.quiz_id, mode }
    },
    onSuccess: ({ quizId, mode }) => {
      setTaskState(null)
      navigate(`/quizzes/${quizId}/play?mode=${mode}`)
    },
    onError: () => setTaskState(null),
  })

  const errorText = mutation.isError
    ? axios.isAxiosError(mutation.error)
      ? (mutation.error.response?.data?.detail ?? (mutation.error as Error).message)
      : (mutation.error as Error).message
    : null

  const canSubmit =
    documentId !== null &&
    topic.trim().length >= 3 &&
    (!useOwnKey || apiKey.trim().length > 0)
  const busy = mutation.isPending

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <Link
          to="/library"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          &larr; Back to library
        </Link>
        <h1
          className="mt-2 text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Generate from PDF
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Pick a document and a topic. The AI writes questions grounded in your PDF.
        </p>
      </div>

      {readyDocs.length === 0 ? (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <p className="text-slate-600 dark:text-slate-400">
            You don't have any ready documents yet. Upload a PDF in your library first.
          </p>
          <Link
            to="/library"
            className="inline-block rounded-lg px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700"
          >
            Go to library
          </Link>
        </div>
      ) : (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 space-y-6">
          <Step n={1} title="Pick a document">
            <select
              value={documentId ?? ''}
              onChange={(e) => setDocumentId(Number(e.target.value) || null)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose a document --</option>
              {readyDocs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.chunk_count} chunks)
                </option>
              ))}
            </select>
            {selectedDoc && (
              <p className="mt-1 text-xs text-slate-500">
                {selectedDoc.page_count} pages, {selectedDoc.chunk_count} chunks indexed.
              </p>
            )}
          </Step>

          <Step n={2} title="What topic should the quiz cover?">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. main concepts, machine learning basics, key arguments"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Used to retrieve the 8 most semantically similar chunks from your document
              via cosine search.
            </p>
          </Step>

          <Step n={3} title="Quiz details">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Title (optional)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={selectedDoc ? `Quiz from ${selectedDoc.title}` : 'Quiz title'}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Number of questions (1-50)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={num}
                  onChange={(e) =>
                    setNum(Math.max(1, Math.min(50, Number(e.target.value) || 1)))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </Step>

          <Step n={4} title="AI provider">
            <div className="grid sm:grid-cols-2 gap-3">
              <ProviderRadio
                value="groq"
                current={provider}
                title="Groq"
                description="Fast inference, Llama 3.3 70B."
                onChange={setProvider}
              />
              <ProviderRadio
                value="gemini"
                current={provider}
                title="Google Gemini"
                description="Higher quality, gemini-2.0-flash."
                onChange={setProvider}
              />
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useOwnKey}
                  onChange={(e) => setUseOwnKey(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600"
                />
                <span className="text-sm">
                  <span className="font-medium block">Use my own API key (recommended)</span>
                  <span className="text-xs text-slate-500">
                    Bypasses the server quota. Per-request, never stored.
                  </span>
                </span>
              </label>
              {useOwnKey && (
                <input
                  type="password"
                  placeholder={provider === 'groq' ? 'gsk_...' : 'AIza...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                  className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          </Step>

          <Step n={5} title="Generate and start">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => mutation.mutate('flashcard')}
                disabled={!canSubmit || busy}
                className="rounded-lg py-3 font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                Generate &rarr; Flashcard
              </button>
              <button
                type="button"
                onClick={() => mutation.mutate('exam')}
                disabled={!canSubmit || busy}
                className="rounded-lg py-3 font-semibold bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                Generate &rarr; Exam
              </button>
            </div>
            {busy && <TaskProgress state={taskState} provider={provider} num={num} />}
            {errorText && (
              <p
                role="alert"
                className="mt-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2"
              >
                {errorText}
              </p>
            )}
          </Step>
        </div>
      )}
    </div>
  )
}

function TaskProgress({
  state,
  provider,
  num,
}: {
  state: TaskState | null
  provider: AiProvider
  num: number
}) {
  const label =
    state === 'PENDING' || state === null
      ? 'Queued — waiting for the worker...'
      : state === 'STARTED'
        ? `Retrieving chunks + generating ${num} questions with ${provider === 'groq' ? 'Groq' : 'Gemini'}...`
        : state === 'RETRY'
          ? 'Worker retrying after a transient error...'
          : 'Processing...'
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm flex items-center gap-3"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-emerald-700 dark:text-emerald-200">{label}</span>
    </div>
  )
}

interface StepProps {
  n: number
  title: React.ReactNode
  children: React.ReactNode
}

function Step({ n, title, children }: StepProps) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200 text-xs font-bold">
          {n}
        </span>
        {title}
      </label>
      {children}
    </div>
  )
}

interface ProviderRadioProps {
  value: AiProvider
  current: AiProvider
  title: string
  description: string
  onChange: (v: AiProvider) => void
}

function ProviderRadio({
  value,
  current,
  title,
  description,
  onChange,
}: ProviderRadioProps) {
  const active = value === current
  return (
    <label
      className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
        active
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <input
        type="radio"
        name="rag-provider"
        value={value}
        checked={active}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{description}</p>
    </label>
  )
}
