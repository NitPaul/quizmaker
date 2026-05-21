import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchMe } from '../api/auth'
import { useAuthStore } from '../store/auth'

export function Home() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: !user,
  })

  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  const current = user ?? data
  const displayName = current?.first_name || current?.email?.split('@')[0]

  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1
          className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {isLoading ? 'Loading...' : `Welcome${displayName ? `, ${displayName}` : ''}.`}
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
          Generate study quizzes from CSVs, pasted text, or your PDFs.
        </p>
      </section>

      <section className="grid sm:grid-cols-3 gap-6">
        <Card
          to="/quizzes/new"
          title="Instant Quiz"
          description="Upload a CSV or XLSX with questions to start studying instantly."
          accent="from-indigo-500 to-blue-500"
        />
        <Card
          to="/quizzes/new-ai"
          title="AI from Text"
          description="Paste content. Pick Groq or Gemini. Get a quiz back in seconds."
          accent="from-fuchsia-500 to-purple-500"
        />
        <Card
          to="/library"
          title="RAG over PDFs"
          description="Upload PDFs once. Generate quizzes grounded in the source."
          accent="from-emerald-500 to-teal-500"
        />
      </section>
    </div>
  )
}

interface CardProps {
  title: string
  description: string
  accent: string
  comingSoon?: boolean
  to?: string
}

function Card({ title, description, accent, comingSoon, to }: CardProps) {
  const inner = (
    <>
      <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${accent} mb-4`} />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      {comingSoon && (
        <span className="absolute top-4 right-4 text-xs font-medium uppercase tracking-wide text-slate-400">
          Soon
        </span>
      )}
    </>
  )
  const className =
    'relative block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-lg transition-shadow'
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    )
  }
  return <div className={className}>{inner}</div>
}
