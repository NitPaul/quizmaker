import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'
import { Footer } from './Footer'
import { HelpModal } from './HelpModal'

export function Layout() {
  const { user, access, logout } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [helpOpen, setHelpOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link
              to="/"
              className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent flex-shrink-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              QuizMaker
            </Link>
            {access && (
              <nav className="hidden md:flex items-center gap-1 text-sm">
                <NavItem to="/library">Library</NavItem>
                <NavItem to="/history">History</NavItem>
                <NavItem to="/profile">Profile</NavItem>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Open help"
            >
              Help
            </button>
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            {access ? (
              <>
                <span className="hidden sm:inline text-sm text-slate-600 dark:text-slate-400">
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main
        key={location.pathname}
        className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in"
      >
        <Outlet />
      </main>
      <Footer />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg font-medium transition-colors ${
          isActive
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`
      }
    >
      {children}
    </NavLink>
  )
}
