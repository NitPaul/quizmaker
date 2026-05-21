import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchMe } from '../api/auth'
import { fetchUserStats } from '../api/stats'
import { ProfileSkeleton } from '../components/Skeleton'

export function Profile() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchUserStats,
  })

  const displayName =
    (user?.first_name?.trim() || '') + (user?.last_name ? ` ${user.last_name}` : '')
  const initial = (displayName || user?.email || '?').charAt(0).toUpperCase()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <Link
          to="/"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          &larr; Back to home
        </Link>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 flex items-center gap-5">
        <div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center text-3xl font-bold"
          style={{ fontFamily: 'var(--font-display)' }}
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <h1
            className="text-2xl font-bold truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {displayName || user?.email?.split('@')[0] || 'Your profile'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          {user?.date_joined && (
            <p className="text-xs text-slate-400 mt-1">
              Joined {new Date(user.date_joined).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Stats</h2>
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Quizzes created" value={stats?.quizzes_count ?? 0} accent="indigo" />
            <StatCard label="Attempts taken" value={stats?.attempts_count ?? 0} accent="fuchsia" />
            <StatCard label="Documents uploaded" value={stats?.documents_count ?? 0} accent="emerald" />
            <StatCard
              label="Avg score"
              value={`${stats?.avg_percentage ?? 0}%`}
              accent="indigo"
            />
            <StatCard
              label="Best score"
              value={`${stats?.best_percentage ?? 0}%`}
              accent="emerald"
            />
            <StatCard
              label="Questions answered"
              value={stats?.total_questions ?? 0}
              accent="fuchsia"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link
          to="/history"
          className="rounded-lg px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          See attempt history
        </Link>
        <Link
          to="/library"
          className="rounded-lg px-4 py-2 border border-slate-300 dark:border-slate-700 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          PDF library
        </Link>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  accent: 'indigo' | 'fuchsia' | 'emerald'
}

function StatCard({ label, value, accent }: StatCardProps) {
  const accentClasses = {
    indigo: 'from-indigo-500 to-blue-500',
    fuchsia: 'from-fuchsia-500 to-purple-500',
    emerald: 'from-emerald-500 to-teal-500',
  }
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${accentClasses[accent]} mb-3`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
