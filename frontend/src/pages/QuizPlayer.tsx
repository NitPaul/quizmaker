import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  fetchQuiz,
  submitAttempt,
  type AttemptMode,
  type SubmitAttemptPayload,
} from '../api/quizzes'
import { FlashCardMode } from '../components/quiz/FlashCardMode'
import { ExamMode } from '../components/quiz/ExamMode'
import { CardSkeleton } from '../components/Skeleton'

export function QuizPlayer() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [confirmQuit, setConfirmQuit] = useState(false)
  const quizId = Number(id)
  const mode: AttemptMode = params.get('mode') === 'exam' ? 'exam' : 'flashcard'
  const timerSeconds = Math.max(0, Number(params.get('timer')) || 0)
  const allowSkip = params.get('skip') === '1'

  const {
    data: quiz,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => fetchQuiz(quizId),
    enabled: !Number.isNaN(quizId),
  })

  const submitMutation = useMutation({
    mutationFn: (payload: Pick<SubmitAttemptPayload, 'duration_seconds' | 'answers'>) =>
      submitAttempt(quizId, { mode, ...payload }),
    onSuccess: (attempt) => {
      navigate(`/quizzes/${quizId}/results/${attempt.id}`, { replace: true })
    },
  })

  const submitError = submitMutation.isError
    ? axios.isAxiosError(submitMutation.error)
      ? formatSubmitError(submitMutation.error.response?.data)
      : 'Failed to submit. Check your connection and try again.'
    : null

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <CardSkeleton />
      </div>
    )
  }
  if (error || !quiz) {
    return (
      <div className="text-center space-y-3">
        <p className="text-rose-600 dark:text-rose-400">Failed to load quiz.</p>
        <Link
          to="/"
          className="inline-block rounded-lg px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {mode === 'flashcard' ? 'Flashcard mode' : 'Exam mode'}
            {allowSkip && <span className="ml-2 text-indigo-600 dark:text-indigo-400">· skipping allowed</span>}
          </p>
          <h1
            className="text-xl font-semibold truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {quiz.title}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setConfirmQuit(true)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 flex-shrink-0"
        >
          Quit
        </button>
      </div>

      {submitError && (
        <div
          role="alert"
          className="max-w-3xl mx-auto mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm"
        >
          <strong>Submit failed:</strong> {submitError}
        </div>
      )}

      {mode === 'flashcard' ? (
        <FlashCardMode
          quiz={quiz}
          allowSkip={allowSkip}
          timerSeconds={timerSeconds}
          onSubmit={submitMutation.mutate}
          submitting={submitMutation.isPending}
        />
      ) : (
        <ExamMode
          quiz={quiz}
          allowSkip={allowSkip}
          timerSeconds={timerSeconds}
          onSubmit={submitMutation.mutate}
          submitting={submitMutation.isPending}
        />
      )}

      {confirmQuit && (
        <QuitDialog
          onCancel={() => setConfirmQuit(false)}
          onConfirm={() => navigate('/')}
        />
      )}
    </div>
  )
}

function QuitDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quit-title"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
      >
        <h2 id="quit-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Quit this quiz?
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your progress will be lost. You can always start a new quiz from the same file.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 border border-slate-300 dark:border-slate-700 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Keep going
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 bg-rose-500 text-white font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  )
}

function formatSubmitError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Unknown error.'
  const obj = data as Record<string, unknown>
  if (typeof obj.detail === 'string') return obj.detail
  const messages: string[] = []
  for (const [field, value] of Object.entries(obj)) {
    const text = Array.isArray(value) ? value.join(', ') : String(value)
    messages.push(`${field}: ${text}`)
  }
  return messages.join(' — ') || 'Unknown error.'
}
