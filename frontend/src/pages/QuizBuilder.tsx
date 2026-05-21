import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { parseFile, type ParsedQuestion } from '../lib/csv'
import { applyRandomness } from '../lib/shuffle'
import { createQuiz, type AttemptMode } from '../api/quizzes'

export function QuizBuilder() {
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedQuestion[] | null>(null)
  const [title, setTitle] = useState('')
  const [num, setNum] = useState(10)
  const [randomness, setRandomness] = useState(100)
  const [timerMinutes, setTimerMinutes] = useState(0)
  const [allowSkip, setAllowSkip] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleFile = async (f: File | null) => {
    setParseError(null)
    setFile(f)
    setParsed(null)
    if (!f) return
    try {
      const result = await parseFile(f)
      if (result.length === 0) throw new Error('No valid questions found in the file.')
      setParsed(result)
      setTitle(f.name.replace(/\.(csv|xlsx|xls)$/i, ''))
      setNum(Math.min(num, result.length))
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file.')
    }
  }

  const startMutation = useMutation({
    mutationFn: async (mode: AttemptMode) => {
      if (!parsed) throw new Error('No questions parsed yet.')
      if (!title.trim()) throw new Error('Please give your quiz a title.')
      const selected = applyRandomness(parsed, num, randomness)
      const questions = selected.map((q) => ({
        text: q.question,
        correct_answer: q.correctAnswer,
        options: q.options,
      }))
      const quiz = await createQuiz({
        title: title.trim(),
        source: 'csv',
        randomness,
        questions,
      })
      return { quiz, mode }
    },
    onSuccess: ({ quiz, mode }) => {
      const params = new URLSearchParams({ mode })
      if (timerMinutes > 0) params.set('timer', String(timerMinutes * 60))
      if (allowSkip) params.set('skip', '1')
      navigate(`/quizzes/${quiz.id}/play?${params.toString()}`)
    },
  })

  const errorText = startMutation.isError
    ? axios.isAxiosError(startMutation.error)
      ? formatApiError(startMutation.error.response?.data)
      : (startMutation.error as Error).message
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
          className="mt-2 text-3xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Instant Quiz Setup
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Upload a CSV or XLSX file. We'll parse it in your browser — nothing leaves your machine until you start the quiz.
        </p>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 space-y-6">
        <Step n={1} title="Upload file (CSV or XLSX)">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900 focus:outline-none"
          />
          <FormatHint />
          {file && parsed && (
            <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Loaded {parsed.length} {parsed.length === 1 ? 'question' : 'questions'} from {file.name}.
            </p>
          )}
          {parseError && (
            <p
              role="alert"
              className="mt-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2"
            >
              {parseError}
            </p>
          )}
        </Step>

        {parsed && (
          <>
            <Step n={2} title="Quiz title">
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Geography Basics"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Step>

            <Step n={3} title={`Number of questions (max ${parsed.length})`}>
              <input
                id="num"
                type="number"
                min={1}
                max={parsed.length}
                value={num}
                onChange={(e) =>
                  setNum(Math.max(1, Math.min(parsed.length, Number(e.target.value) || 1)))
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Step>

            <Step
              n={4}
              title={
                <>
                  Randomness:{' '}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {randomness}%
                  </span>
                </>
              }
            >
              <input
                id="randomness"
                type="range"
                min={0}
                max={100}
                value={randomness}
                onChange={(e) => setRandomness(Number(e.target.value))}
                className="w-full accent-indigo-600"
                aria-label="Randomness percentage"
              />
              <p className="mt-1 text-xs text-slate-500">
                100% = fully shuffled. 0% = keep original order.
              </p>
            </Step>

            <Step n={5} title="Options (optional)">
              <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                <div>
                  <label
                    htmlFor="timer"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    Time limit
                    <span className="text-xs text-slate-500 font-normal">
                      (minutes; 0 = no time limit)
                    </span>
                  </label>
                  <input
                    id="timer"
                    type="number"
                    min={0}
                    max={180}
                    value={timerMinutes}
                    onChange={(e) =>
                      setTimerMinutes(Math.max(0, Math.min(180, Number(e.target.value) || 0)))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {timerMinutes > 0 && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      Quiz will auto-submit at 0:00.
                    </p>
                  )}
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowSkip}
                    onChange={(e) => setAllowSkip(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-sm">
                    <span className="font-medium block">Allow skipping questions</span>
                    <span className="text-xs text-slate-500">
                      Flashcard mode adds a "Skip" button. Exam mode lets you submit without answering everything. Off by default — all questions are mandatory.
                    </span>
                  </span>
                </label>
              </div>
            </Step>

            <PreviewQuestions parsed={parsed} />

            <Step n={6} title="Choose a mode and start">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ModeButton
                  variant="flashcard"
                  onClick={() => startMutation.mutate('flashcard')}
                  disabled={startMutation.isPending}
                />
                <ModeButton
                  variant="exam"
                  onClick={() => startMutation.mutate('exam')}
                  disabled={startMutation.isPending}
                />
              </div>
              {startMutation.isPending && (
                <p className="mt-3 text-center text-sm text-slate-500">Creating quiz...</p>
              )}
              {errorText && (
                <p
                  role="alert"
                  className="mt-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2"
                >
                  {errorText}
                </p>
              )}
            </Step>
          </>
        )}
      </div>
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
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 text-xs font-bold">
          {n}
        </span>
        {title}
      </label>
      {children}
    </div>
  )
}

function FormatHint() {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected format</p>
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
        5 columns in this order: <code className="px-1 rounded bg-slate-200 dark:bg-slate-800">Question</code>,{' '}
        <code className="px-1 rounded bg-slate-200 dark:bg-slate-800">CorrectAnswer</code>,{' '}
        <code className="px-1 rounded bg-slate-200 dark:bg-slate-800">Option2</code>,{' '}
        <code className="px-1 rounded bg-slate-200 dark:bg-slate-800">Option3</code>,{' '}
        <code className="px-1 rounded bg-slate-200 dark:bg-slate-800">Option4</code>. First row is the header.
      </p>
      <p className="mt-2 text-xs">
        <a
          href="/sample-quiz.csv"
          download
          className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          Download a sample CSV
        </a>
        <span className="text-slate-400"> — or click "Help" in the header for full instructions.</span>
      </p>
    </div>
  )
}

function PreviewQuestions({ parsed }: { parsed: ParsedQuestion[] }) {
  const preview = parsed.slice(0, 3)
  return (
    <details className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
      <summary className="cursor-pointer px-4 py-2 text-sm font-medium select-none">
        Preview first {preview.length} parsed question{preview.length === 1 ? '' : 's'}
      </summary>
      <ul className="px-4 pb-3 space-y-2 text-sm">
        {preview.map((q, i) => (
          <li key={i} className="border-l-2 border-indigo-400 pl-3">
            <p className="font-medium">{q.question}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Correct: <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{q.correctAnswer}</span>
              {' · '}Options: {q.options.join(', ')}
            </p>
          </li>
        ))}
      </ul>
    </details>
  )
}

interface ModeButtonProps {
  variant: 'flashcard' | 'exam'
  onClick: () => void
  disabled: boolean
}

function ModeButton({ variant, onClick, disabled }: ModeButtonProps) {
  const isFlashcard = variant === 'flashcard'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative rounded-lg p-4 text-left font-semibold border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
        isFlashcard
          ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
          : 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      <span className="block text-base">{isFlashcard ? 'Flashcard' : 'Exam'}</span>
      <span className={`block text-xs font-normal mt-0.5 ${isFlashcard ? 'text-indigo-600/80 dark:text-indigo-300/80' : 'text-white/80'}`}>
        {isFlashcard ? 'One at a time, with instant feedback' : 'All on one page, submit at the end'}
      </span>
    </button>
  )
}

function formatApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Failed to create quiz.'
  const obj = data as Record<string, unknown>
  if (typeof obj.detail === 'string') return obj.detail
  const messages: string[] = []
  for (const [field, value] of Object.entries(obj)) {
    const text = Array.isArray(value) ? value.join(', ') : String(value)
    messages.push(`${field}: ${text}`)
  }
  return messages.join(' — ') || 'Failed to create quiz.'
}
