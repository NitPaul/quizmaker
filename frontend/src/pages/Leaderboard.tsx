import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchLeaderboard, type LeaderboardEntry } from '../api/leaderboard'
import { LeaderboardSkeleton } from '../components/Skeleton'

export function Leaderboard() {
  const { id } = useParams()
  const quizId = Number(id)
  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', quizId],
    queryFn: () => fetchLeaderboard(quizId),
    enabled: !Number.isNaN(quizId),
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <div className="h-8 w-48 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <LeaderboardSkeleton />
      </div>
    )
  }
  if (error || !data) {
    return <p className="text-center text-rose-600 dark:text-rose-400">Failed to load leaderboard.</p>
  }

  const youInTop = data.top.some((e) => e.is_you)

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
          className="mt-2 text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Leaderboard
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 truncate">{data.quiz_title}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
        {data.top.length === 0 ? (
          <p className="p-6 text-center text-slate-500">No attempts yet — be the first.</p>
        ) : (
          data.top.map((entry) => <LeaderboardRow key={entry.user_id} entry={entry} />)
        )}
      </div>

      {data.you && !youInTop && (
        <>
          <p className="text-xs text-center text-slate-500">Your position</p>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-indigo-300 dark:border-indigo-700">
            <LeaderboardRow entry={data.you} />
          </div>
        </>
      )}
    </div>
  )
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const medalEmoji =
    entry.rank === 1
      ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      : entry.rank === 2
        ? 'border-slate-300 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
        : entry.rank === 3
          ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
          : 'border-slate-200 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
  return (
    <div
      className={`px-4 py-3 flex items-center gap-4 ${
        entry.is_you ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
      }`}
    >
      <span
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${medalEmoji}`}
        aria-hidden="true"
      >
        #{entry.rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">
          {entry.user_display_name}
          {entry.is_you && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium">
              You
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          {entry.score} / {entry.total} &middot; {entry.duration_seconds}s &middot;{' '}
          {new Date(entry.finished_at).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-xl font-bold ${
            entry.percentage >= 70
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {entry.percentage}%
        </p>
      </div>
    </div>
  )
}
