interface FeatureProps {
  title: string
  description: string
  accent: string
  badge?: string
}

function Feature({ title, description, accent, badge }: FeatureProps) {
  const isAvailable = !!badge && /available/i.test(badge)
  return (
    <div className="flex gap-3">
      <div
        className={`w-1 rounded-full bg-gradient-to-b ${accent} flex-shrink-0`}
        aria-hidden="true"
      />
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {badge &&
            (isAvailable ? (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-sm shadow-emerald-500/30 ring-1 ring-emerald-400/40">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                  aria-hidden="true"
                />
                {badge}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {badge}
              </span>
            ))}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}

export function Marketing() {
  return (
    <div className="hidden lg:flex flex-col justify-center px-8 xl:px-12 py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
        QuizMaker
      </p>
      <h2
        className="mt-3 text-4xl xl:text-5xl font-bold leading-tight bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Turn study material into quizzes in seconds.
      </h2>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
        Upload CSVs, paste notes, or drop PDFs. Study with flashcards, take exams,
        and track your scores over time.
      </p>

      <div className="mt-10 space-y-5">
        <Feature
          title="Instant Quiz from CSV/XLSX"
          description="Upload pre-made question sets and start studying instantly. Configure number of questions, randomness, and mode."
          accent="from-indigo-500 to-blue-500"
          badge="Available now"
        />
        <Feature
          title="AI-generated quizzes from text"
          description="Paste any content. Groq or Gemini writes multiple-choice questions for you. Bring your own API key or use the built-in one."
          accent="from-fuchsia-500 to-purple-500"
          badge="Available now"
        />
        <Feature
          title="RAG over your PDFs"
          description="Upload PDFs once. Generate quizzes grounded in your actual study material, with source citations via pgvector."
          accent="from-emerald-500 to-teal-500"
          badge="Available now"
        />
      </div>

      <div className="mt-12 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">2</p>
          <p className="text-slate-500">Quiz modes</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">3</p>
          <p className="text-slate-500">Content sources</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">JWT</p>
          <p className="text-slate-500">Secure auth</p>
        </div>
      </div>
    </div>
  )
}
