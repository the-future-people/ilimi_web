import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function PortalHeader() {
  const { user, activeMember, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()

  return (
    <header className="bg-navy sticky top-0 z-50 shadow-lg border-b-4 border-gold">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between gap-2">
        <a href="/redirect" className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
            <span className="font-serif font-bold text-navy text-sm">I</span>
          </div>
          <div className="min-w-0">
            <div className="font-serif text-base sm:text-lg font-bold text-white leading-none truncate">Ilimi</div>
            <div className="hidden sm:block text-[8px] text-white/40 tracking-widest uppercase truncate">School Management Platform</div>
          </div>
        </a>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Notification bell */}
          <button className="relative w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition flex-shrink-0">
            <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
          </button>

          {/* Profile menu */}
          <div className="relative min-w-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-2 py-1 bg-white/10 rounded-lg hover:bg-white/15 transition min-w-0"
            >
              <div className="w-7 h-7 rounded-md bg-gold text-navy text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
              <div className="text-left hidden sm:block min-w-0 max-w-[140px]">
                <div className="text-xs font-semibold text-white leading-tight truncate">{user?.full_name}</div>
                <div className="text-[9px] text-white/45 uppercase tracking-wide leading-tight truncate">{activeMember?.role_display}</div>
              </div>
              <svg
                className={`w-3 h-3 text-white/40 flex-shrink-0 transition-transform duration-200 ${menuOpen ? 'rotate-180' : 'rotate-0'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            )}

            <div
              className={`absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl w-[210px] p-2 z-50 origin-top-right transition-all duration-150 ${
                menuOpen
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div className="px-1.5 py-1.5">
                <div className="text-xs font-bold text-navy truncate">{user?.full_name}</div>
                <div className="text-[11px] text-gray-400 truncate">{user?.email}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5 truncate">
                  {activeMember?.branch_name ? `${activeMember.branch_name} · ` : ''}{activeMember?.role_display}
                </div>
              </div>

              <button className="w-full flex items-center justify-between px-1.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition text-left mt-0.5">
                <span>Settings</span>
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="h-px bg-gray-100 my-1" />

              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition text-left"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default PortalHeader