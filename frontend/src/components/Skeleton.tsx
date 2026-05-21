import type { HTMLAttributes } from 'react'

export function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}

export function HistorySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 rounded-xl" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
        >
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-10 w-20" />
        </div>
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <>
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 flex items-center gap-5">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="px-4 py-3 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return <Skeleton className="h-[28rem] rounded-2xl" />
}
