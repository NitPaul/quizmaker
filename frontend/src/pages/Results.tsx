import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAttempt, fetchQuiz } from '../api/quizzes'
import { downloadResultsPdf } from '../lib/pdf'

export function Results() {
  const { id, attemptId } = useParams()
  const quizId = Number(id)
  const aId = Number(attemptId)

  const { data: attempt, isLoading: loadingAttempt } = useQuery({
    queryKey: ['attempt', aId],
    queryFn: () => fetchAttempt(aId),
    enabled: !Number.isNaN(aId),
  })
  const { data: quiz, isLoading: loadingQuiz } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => fetchQuiz(quizId),
    enabled: !Number.isNaN(quizId),
  })

  if (loadingAttempt || loadingQuiz) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="h-8 w-48 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-16 w-32 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-40 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    )
  }
  if (!attempt || !quiz) {
    return <p className="text-center text-rose-600 dark:text-rose-400">Failed to load results.</p>
  }

  const questionById = new Map(quiz.questions.map((q) => [q.id, q]))
  const passed = attempt.percentage >= 70

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="text-center bg-white dark:bg-slate-900 rounded-2xl p-8 shadow border border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Quiz complete
        </h1>
        <p
          className={`text-6xl font-bold mt-4 bg-gradient-to-r ${
            passed
              ? 'from-emerald-500 to-teal-500'
              : 'from-rose-500 to-orange-500'
          } bg-clip-text text-transparent`}
        >
          {attempt.score} / {attempt.total}
        </p>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          {attempt.percentage}% &middot; {attempt.duration_seconds}s &middot; {attempt.mode}
        </p>
        <div className="mt-6 flex gap-3 justify-center flex-wrap">
          <button
            type="button"
            onClick={() => downloadResultsPdf(quiz, attempt)}
            className="rounded-lg px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Download PDF
          </button>
          <Link
            to={`/quizzes/${quiz.id}/leaderboard`}
            className="rounded-lg px-4 py-2 bg-amber-500 text-white font-medium hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Leaderboard
          </Link>
          <Link
            to="/quizzes/new"
            className="rounded-lg px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            New quiz
          </Link>
          <Link
            to="/"
            className="rounded-lg px-4 py-2 border border-slate-300 dark:border-slate-700 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Home
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Review</h2>
        <div className="space-y-4">
          {attempt.answers.map((a, i) => {
            const q = questionById.get(a.question)
            if (!q) return null
            const skipped = !a.user_answer
            const status = skipped ? 'skipped' : a.is_correct ? 'correct' : 'wrong'
            const statusClass =
              status === 'correct'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : status === 'wrong'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            const answerClass =
              status === 'correct'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : status === 'wrong'
                  ? 'text-rose-700 dark:text-rose-400 font-semibold'
                  : 'text-slate-500 italic'
            return (
              <div
                key={a.question}
                className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex justify-between items-start gap-4">
                  <p className="font-medium">
                    {i + 1}. {q.text}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded shrink-0 capitalize ${statusClass}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="mt-3 text-sm space-y-1">
                  <p>
                    Your answer: <span className={answerClass}>{a.user_answer || '(skipped)'}</span>
                  </p>
                  {!a.is_correct && (
                    <p>
                      Correct answer:{' '}
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {q.correct_answer}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
