import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { enqueueGenerateQuiz, type AiProvider } from '../api/ai'
import { pollTask, type TaskState } from '../api/tasks'
import type { AttemptMode } from '../api/quizzes'

export function AiBuilder() {
  const [text, setText] = useState('')
  const [num, setNum] = useState(10)
  const [title, setTitle] = useState('')
  const [provider, setProvider] = useState<AiProvider>('groq')
  const [useOwnKey, setUseOwnKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [taskState, setTaskState] = useState<TaskState | null>(null)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: async (mode: AttemptMode) => {
      setTaskState('PENDING')
      const { task_id } = await enqueueGenerateQuiz({
        text: text.trim(),
        num_questions: num,
        title: title.trim() || undefined,
        provider,
        api_key: useOwnKey && apiKey.trim() ? apiKey.trim() : undefined,
      })
      const result = await pollTask<{ quiz_id: number }>(task_id, {
        intervalMs: 1500,
        onTick: setTaskState,
      })
      return { quizId: result.quiz_id, mode }
    },
    onSuccess: ({ quizId, mode }) => {
      setTaskState(null)
      navigate(`/quizzes/${quizId}/play?mode=${mode}`)
    },
    onError: () => {
      setTaskState(null)
    },
  })

  const errorText = mutation.isError
    ? axios.isAxiosError(mutation.error)
      ? formatApiError(mutation.error.response?.data)
      : (mutation.error as Error).message
    : null

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const canSubmit =
    text.trim().length >= 50 && num >= 1 && (!useOwnKey || apiKey.trim().length > 0)
  const busy = mutation.isPending

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
          className="mt-2 text-3xl font-bold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Generate Quiz with AI
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Paste content. We enqueue the work on a Celery worker — the page polls until done.
        </p>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 space-y-6">
        <Step n={1} title="Paste your content">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Paste lecture notes, an article, a textbook chapter, or any text you want to be quizzed on..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            {wordCount} word{wordCount === 1 ? '' : 's'} &middot; minimum 50 characters
            {text.length > 0 && text.length < 50 && (
              <span className="text-rose-600 dark:text-rose-400">
                {' '}
                ({50 - text.length} more needed)
              </span>
            )}
          </p>
        </Step>

        <Step n={2} title="Quiz details">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ai-title" className="block text-xs text-slate-500 mb-1">
                Title (optional)
              </label>
              <input
                id="ai-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="AI generated quiz"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <div>
              <label htmlFor="ai-num" className="block text-xs text-slate-500 mb-1">
                Number of questions (1-50)
              </label>
              <input
                id="ai-num"
                type="number"
                min={1}
                max={50}
                value={num}
                onChange={(e) =>
                  setNum(Math.max(1, Math.min(50, Number(e.target.value) || 1)))
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
          </div>
        </Step>

        <Step n={3} title="AI provider">
          <div className="grid sm:grid-cols-2 gap-3">
            <ProviderRadio
              value="groq"
              current={provider}
              title="Groq"
              description="Fast inference, Llama 3.3 70B. Free tier available."
              onChange={setProvider}
            />
            <ProviderRadio
              value="gemini"
              current={provider}
              title="Google Gemini"
              description="Higher quality output, gemini-2.0-flash."
              onChange={setProvider}
            />
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useOwnKey}
                onChange={(e) => setUseOwnKey(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-fuchsia-600"
              />
              <span className="text-sm">
                <span className="font-medium block">Use my own API key (recommended)</span>
                <span className="text-xs text-slate-500">
                  Bypasses the server's free-tier quota. Key is sent with this request only and never stored.
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
                className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            )}
          </div>
        </Step>

        <Step n={4} title="Generate and start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => mutation.mutate('flashcard')}
              disabled={!canSubmit || busy}
              className="rounded-lg py-3 font-semibold bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-200 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50"
            >
              Generate &rarr; Flashcard
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate('exam')}
              disabled={!canSubmit || busy}
              className="rounded-lg py-3 font-semibold bg-fuchsia-600 text-white hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50"
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
      ? 'Queued — waiting for the worker to pick it up...'
      : state === 'STARTED'
        ? `Generating ${num} questions with ${provider === 'groq' ? 'Groq' : 'Gemini'}...`
        : state === 'RETRY'
          ? 'Worker retrying after a transient error...'
          : 'Processing...'
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-3 rounded-lg border border-fuchsia-200 dark:border-fuchsia-900 bg-fuchsia-50 dark:bg-fuchsia-950/30 px-4 py-3 text-sm flex items-center gap-3"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
      <span className="text-fuchsia-700 dark:text-fuchsia-200">{label}</span>
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
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/60 text-fuchsia-700 dark:text-fuchsia-200 text-xs font-bold">
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

function ProviderRadio({ value, current, title, description, onChange }: ProviderRadioProps) {
  const active = value === current
  return (
    <label
      className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
        active
          ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/30'
          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <input
        type="radio"
        name="ai-provider"
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

function formatApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'AI generation failed.'
  const obj = data as Record<string, unknown>
  if (typeof obj.detail === 'string') return obj.detail
  const messages: string[] = []
  for (const [field, value] of Object.entries(obj)) {
    const text = Array.isArray(value) ? value.join(', ') : String(value)
    messages.push(`${field}: ${text}`)
  }
  return messages.join(' — ') || 'AI generation failed.'
}
