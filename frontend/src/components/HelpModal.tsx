import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
          <h2
            id="help-title"
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            How to use QuizMaker
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close help"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-8 text-slate-700 dark:text-slate-300">
          <Section title="1. What QuizMaker does">
            <p>
              QuizMaker turns your study content into multiple-choice quizzes.
              Upload questions, paste text, or drop PDFs (soon), then study with flashcards
              or take a timed exam. Every attempt is scored server-side and saved to your history.
            </p>
          </Section>

          <Section title="2. The two quiz modes">
            <div className="grid sm:grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30">
                <h4 className="font-semibold text-indigo-700 dark:text-indigo-300">Flashcard mode</h4>
                <p className="text-sm mt-2">
                  One question at a time. Click an option — the card flips and shows
                  the correct answer with green/red feedback. Best for spaced studying.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-fuchsia-200 dark:border-fuchsia-900 bg-fuchsia-50/50 dark:bg-fuchsia-950/30">
                <h4 className="font-semibold text-fuchsia-700 dark:text-fuchsia-300">Exam mode</h4>
                <p className="text-sm mt-2">
                  All questions on one page. Answer in any order, submit when ready.
                  The server scores everything and shows a full review. Best for practice tests.
                </p>
              </div>
            </div>
          </Section>

          <Section title="3. Instant Quiz — CSV file format">
            <p>Save a spreadsheet as <Code>.csv</Code> with these 5 columns in this order:</p>
            <ol className="mt-3 list-decimal list-inside text-sm space-y-1 ml-2">
              <li><Code>Question</Code> — the question text</li>
              <li><Code>CorrectAnswer</Code> — the right answer</li>
              <li><Code>Option2</Code> — a wrong option</li>
              <li><Code>Option3</Code> — another wrong option</li>
              <li><Code>Option4</Code> — another wrong option</li>
            </ol>
            <p className="mt-3 text-sm">The first row must be the header. Each subsequent row is one question. Avoid commas inside cells unless you wrap them in double quotes.</p>
            <pre className="mt-3 p-3 rounded-lg bg-slate-900 text-slate-100 text-xs overflow-x-auto font-mono leading-relaxed">{`Question,CorrectAnswer,Option2,Option3,Option4
What is the capital of France?,Paris,London,Madrid,Berlin
Which is the largest ocean?,Pacific,Atlantic,Indian,Arctic
Which is the tallest mountain?,Everest,K2,Kilimanjaro,Denali`}</pre>
            <p className="mt-3 text-sm">
              <a
                href="/sample-quiz.csv"
                download
                className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                Download a sample CSV
              </a>
            </p>
          </Section>

          <Section title="4. Instant Quiz — Excel (XLSX) format">
            <p>
              Same columns as CSV, in the <strong>first sheet</strong> of the workbook.
              The header row is required. Numbers and text both work — they're converted to text on upload.
            </p>
          </Section>

          <Section title="5. Randomness slider">
            <p>Controls how much the question order is shuffled when you start the quiz.</p>
            <ul className="mt-2 list-disc list-inside text-sm space-y-1 ml-2">
              <li><strong>100%</strong> — fully shuffled (recommended for studying)</li>
              <li><strong>0%</strong> — keep the original order from the file</li>
              <li>
                Anywhere in between — the first portion is kept in order, the
                rest is randomly drawn from the remainder.
              </li>
            </ul>
          </Section>

          <Section title="6. AI from Text">
            <p>
              From the home page, pick "AI from Text" and paste any content (lecture notes,
              an article, a textbook chapter). Choose a provider (Groq for speed, Gemini for
              depth) and the model writes multiple-choice questions about that content.
              Use the built-in server key or paste your own per-request.
            </p>
          </Section>

          <Section title="7. RAG over PDFs">
            <p>
              From the home page, pick "RAG over PDFs" to open your Library. Upload a PDF
              and the app extracts the text, splits it into chunks, generates vector
              embeddings, and stores them in Postgres + pgvector. When you generate a quiz,
              it retrieves the most relevant chunks via cosine similarity and asks the AI
              to write questions grounded in your actual material.
            </p>
          </Section>

          <Section title="8. Tips">
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Use the dark/light toggle in the header at any time. Your preference is saved.</li>
              <li>Your tokens are stored locally — you'll stay logged in across reloads.</li>
              <li>Server-side scoring means your score is trustworthy — no client tampering.</li>
              <li>Press <Code>Esc</Code> to close this dialog.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[0.85em] font-mono">
      {children}
    </code>
  )
}
