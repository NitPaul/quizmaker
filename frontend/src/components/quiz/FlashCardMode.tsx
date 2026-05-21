import { useRef, useState } from 'react'
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

export function FlashCardMode({
  quiz,
  allowSkip,
  timerSeconds,
  onSubmit,
  submitting,
}: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const answersRef = useRef<{ question_id: number; user_answer: string }[]>([])
  const startedAtRef = useRef<number>(Date.now())
  const submittedRef = useRef(false)

  const current = quiz.questions[index]
  const total = quiz.questions.length
  const isLast = index === total - 1
  const progressPercent = (index / total) * 100

  const finish = () => {
    if (submittedRef.current) return
    submittedRef.current = true
    const duration_seconds = Math.round((Date.now() - startedAtRef.current) / 1000)
    onSubmit({ duration_seconds, answers: answersRef.current })
  }

  const remaining = useCountdown(timerSeconds, finish)
  const lowTime = timerSeconds > 0 && remaining <= 30 && remaining > 0

  if (!current) return null

  const choose = (option: string) => {
    if (selected) return
    setSelected(option)
    answersRef.current.push({ question_id: current.id, user_answer: option })
    if (option === current.correct_answer) setScore((s) => s + 1)
  }

  const skip = () => {
    if (selected) return
    answersRef.current.push({ question_id: current.id, user_answer: '' })
    if (isLast) {
      finish()
      return
    }
    setIndex((i) => i + 1)
  }

  const advance = () => {
    if (isLast) {
      finish()
      return
    }
    setSelected(null)
    setIndex((i) => i + 1)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Question {index + 1} of {total}
        </span>
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
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Score: {score}
          </span>
        </div>
      </div>
      <div
        className="h-2 mb-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <Card key={current.id} question={current} selected={selected} onSelect={choose} />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allowSkip && !selected && (
          <button
            type="button"
            onClick={skip}
            disabled={submitting}
            className="rounded-lg border-2 border-slate-300 dark:border-slate-700 font-semibold py-3 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Skip question
          </button>
        )}
        {selected && (
          <button
            type="button"
            onClick={advance}
            disabled={submitting}
            className={`${
              allowSkip ? 'sm:col-span-2' : 'sm:col-span-2'
            } rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold py-3 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50`}
          >
            {submitting ? 'Submitting...' : isLast ? 'Finish quiz' : 'Next question'}
          </button>
        )}
      </div>
    </div>
  )
}

interface CardProps {
  question: Question
  selected: string | null
  onSelect: (option: string) => void
}

function Card({ question, selected, onSelect }: CardProps) {
  const [shuffled] = useState(() => shuffle(question.options))
  const flipped = selected !== null
  const isCorrect = selected === question.correct_answer

  return (
    <div className="relative w-full h-[28rem] [perspective:1000px]">
      <div
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-lg flex flex-col">
          <p className="text-lg font-medium mb-6">{question.text}</p>
          <div className="grid gap-2 mt-auto">
            {shuffled.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onSelect(opt)}
                disabled={!!selected}
                className={optionClass(opt, selected, question.correct_answer)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white p-6 shadow-lg flex flex-col items-center justify-center text-center">
          <p
            className={`text-3xl font-bold ${
              isCorrect ? 'text-emerald-200' : 'text-rose-200'
            }`}
          >
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </p>
          <p className="mt-4 text-sm uppercase tracking-wide opacity-80">Correct answer</p>
          <p className="mt-1 text-2xl font-semibold">{question.correct_answer}</p>
        </div>
      </div>
    </div>
  )
}

function optionClass(opt: string, selected: string | null, correct: string) {
  const base =
    'w-full text-left px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 '
  if (!selected) {
    return (
      base +
      'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
    )
  }
  if (opt === correct) {
    return (
      base +
      'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-900 dark:text-emerald-100'
    )
  }
  if (opt === selected) {
    return (
      base +
      'bg-rose-100 dark:bg-rose-900/40 border-rose-500 text-rose-900 dark:text-rose-100'
    )
  }
  return base + 'border-slate-200 dark:border-slate-700 opacity-50'
}
