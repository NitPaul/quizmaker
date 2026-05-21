import { useMemo, useRef, useState } from 'react'
import type { Question, Quiz, SubmitAttemptPayload } from '../../api/quizzes'
import { shuffle } from '../../lib/shuffle'
import { formatMmSs, useCountdown } from '../../lib/timer'

interface Props {
  quiz: Quiz
  allowSkip: boolean
  timerSeconds: number
  onSubmit: (payload: Pick<SubmitAttemptPayload, 'duration_seconds' | 'answers'>) => void
  submitting: boolean
}

export function ExamMode({
  quiz,
  allowSkip,
  timerSeconds,
  onSubmit,
  submitting,
}: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showUnansweredHint, setShowUnansweredHint] = useState(false)
  const startedAtRef = useRef<number>(Date.now())
  const answersRef = useRef(answers)
  answersRef.current = answers
  const submittedRef = useRef(false)
  const answeredCount = Object.keys(answers).length
  const total = quiz.questions.length
  const allAnswered = answeredCount === total

  const submitAttempt = () => {
    if (submittedRef.current) return
    submittedRef.current = true
    const duration_seconds = Math.round((Date.now() - startedAtRef.current) / 1000)
    const formattedAnswers = quiz.questions.map((q) => ({
      question_id: q.id,
      user_answer: answersRef.current[q.id] ?? '',
    }))
    onSubmit({ duration_seconds, answers: formattedAnswers })
  }

  const remaining = useCountdown(timerSeconds, submitAttempt)
  const lowTime = timerSeconds > 0 && remaining <= 30 && remaining > 0

  const submit = () => {
    if (!allowSkip && !allAnswered) {
      const firstUnanswered = quiz.questions.find((q) => !answers[q.id])
      if (firstUnanswered) {
        document
          .getElementById(`exam-q-${firstUnanswered.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setShowUnansweredHint(true)
      }
      return
    }
    submitAttempt()
  }

  const canSubmit = allowSkip || allAnswered
  const submitButtonClass = canSubmit
    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800">
      <div className="sticky top-0 px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 rounded-t-2xl z-10">
        <div className="flex justify-between items-center mb-2 gap-4 flex-wrap">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {quiz.title}
          </h2>
          <div className="flex items-center gap-4">
            {timerSeconds > 0 && (
              <span
                className={`text-sm font-mono font-bold ${
                  lowTime ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'
                }`}
                aria-live="polite"
              >
                {formatMmSs(remaining)}
              </span>
            )}
            <span className="text-sm font-medium text-slate-500" aria-live="polite">
              {answeredCount} of {total} answered
            </span>
          </div>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${(answeredCount / total) * 100}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {quiz.questions.map((q, i) => (
          <ExamQuestion
            key={q.id}
            question={q}
            index={i}
            value={answers[q.id]}
            onChange={(v) => {
              setAnswers((prev) => ({ ...prev, [q.id]: v }))
              setShowUnansweredHint(false)
            }}
          />
        ))}

        {showUnansweredHint && !canSubmit && (
          <p
            role="alert"
            className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2"
          >
            Please answer all {total} questions before submitting. We scrolled to the first unanswered one.
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className={`w-full rounded-lg font-semibold py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${submitButtonClass}`}
        >
          {submitting
            ? 'Submitting...'
            : canSubmit
              ? `Submit exam${allowSkip && !allAnswered ? ` (${total - answeredCount} skipped)` : ''}`
              : `Review unanswered (${total - answeredCount} remaining)`}
        </button>
      </div>
    </div>
  )
}

interface ExamQuestionProps {
  question: Question
  index: number
  value: string | undefined
  onChange: (value: string) => void
}

function ExamQuestion({ question, index, value, onChange }: ExamQuestionProps) {
  const shuffled = useMemo(() => shuffle(question.options), [question.id])
  const answered = value !== undefined
  return (
    <div id={`exam-q-${question.id}`} className="text-left scroll-mt-32">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 ${
            answered
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
          }`}
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <p className="font-semibold pt-1">{question.text}</p>
      </div>
      <div className="mt-3 ml-10 space-y-2">
        {shuffled.map((opt) => (
          <label
            key={opt}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
              value === opt
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="accent-indigo-600"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
