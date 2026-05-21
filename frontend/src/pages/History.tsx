import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAttempts, type AttemptListItem } from '../api/attempts'
import { HistorySkeleton } from '../components/Skeleton'

export function History() {
  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['attempts'],
    queryFn: () => fetchAttempts(),
  })

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
          className="mt-2 text-3xl font-bold bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Attempt History
        </h1>
      </div>

      {!isLoading && attempts.length > 0 && <ScoreSparkline attempts={attempts} />}

      <div className="space-y-3">
        {isLoading ? (
          <HistorySkeleton />
        ) : attempts.length === 0 ? (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-slate-600 dark:text-slate-400">No attempts yet.</p>
            <Link
              to="/"
              className="mt-3 inline-block rounded-lg px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              Take your first quiz
            </Link>
          </div>
        ) : (
          attempts.map((a) => <AttemptRow key={a.id} attempt={a} />)
        )}
      </div>
    </div>
  )
}

function AttemptRow({ attempt }: { attempt: AttemptListItem }) {
  const date = new Date(attempt.finished_at)
  const dateStr = date.toLocaleDateString()
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-semibold truncate">{attempt.quiz_title}</p>
        <p className="text-xs text-slate-500 mt-1 capitalize">
          {attempt.mode} mode &middot; {dateStr} {timeStr} &middot; {attempt.duration_seconds}s
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p
            className={`text-xl font-bold ${
              attempt.percentage >= 70
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {attempt.percentage}%
          </p>
          <p className="text-xs text-slate-500">
            {attempt.score} / {attempt.total}
          </p>
        </div>
        <Link
          to={`/quizzes/${attempt.quiz}/results/${attempt.id}`}
          className="rounded-lg px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
        >
          Review
        </Link>
      </div>
    </div>
  )
}

function ScoreSparkline({ attempts }: { attempts: AttemptListItem[] }) {
  // attempts come ordered newest -> oldest; reverse for chronological
  const points = [...attempts].reverse()
  const w = 600
  const h = 80
  const pad = 6
  const xStep = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0
  const polyPoints = points
    .map((a, i) => {
      const x = pad + i * xStep
      const y = h - pad - (a.percentage / 100) * (h - pad * 2)
      return `${x},${y}`
    })
    .join(' ')
  const avg =
    points.reduce((s, a) => s + a.percentage, 0) / (points.length || 1)
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-baseline mb-2">
        <p className="text-sm font-medium">Score over time</p>
        <p className="text-xs text-slate-500">avg {avg.toFixed(1)}%</p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
        <line
          x1={pad}
          x2={w - pad}
          y1={h / 2}
          y2={h / 2}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeDasharray="4 4"
        />
        <polyline
          fill="none"
          stroke="url(#sg)"
          strokeWidth="2"
          points={polyPoints}
        />
        {points.map((a, i) => {
          const x = pad + i * xStep
          const y = h - pad - (a.percentage / 100) * (h - pad * 2)
          return (
            <circle
              key={a.id}
              cx={x}
              cy={y}
              r={3}
              fill={a.percentage >= 70 ? '#10b981' : '#f43f5e'}
            >
              <title>{`${a.quiz_title}: ${a.percentage}%`}</title>
            </circle>
          )
        })}
        <defs>
          <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
