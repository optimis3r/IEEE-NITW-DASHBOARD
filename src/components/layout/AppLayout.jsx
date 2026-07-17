import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogOut, Menu, X, Zap, ShieldCheck } from 'lucide-react'
import { NAV_ITEMS } from '../../lib/navigation'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  member: 'Member',
}

function navLinkClasses({ isActive }) {
  return [
    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-neon-gradient text-white shadow-neon-sm'
      : 'text-slate-400 hover:text-slate-100 hover:bg-white/10',
  ].join(' ')
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-gradient shadow-neon-sm">
        <Zap size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-bold tracking-wide text-white">IEEE NITW</p>
        <p className="text-[11px] text-slate-400">Operations Hub</p>
      </div>
    </div>
  )
}

function UserCard() {
  const { profile, role, signOut } = useAuth()
  return (
    <div className="glass !rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">
            {profile?.full_name || profile?.email || '—'}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-neon-indigo">
            <ShieldCheck size={12} />
            {ROLE_LABELS[role] ?? 'Loading…'}
          </p>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-red-400"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}

/** Fixed frosted sidebar — desktop (lg+) only. */
function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-6 border-r border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:flex">
      <Brand />
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'} className={navLinkClasses}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <UserCard />
    </aside>
  )
}

/** Mobile top bar with hamburger + slide-in drawer for the full nav list. */
function MobileHeader({ drawerOpen, setDrawerOpen }) {
  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-abyss-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Brand />
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col gap-6 border-l border-white/10 bg-abyss-900/95 p-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-200">Menu</p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  className={navLinkClasses}
                  onClick={() => setDrawerOpen(false)}
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <UserCard />
          </div>
        </div>
      )}
    </>
  )
}

/** Frosted bottom tab bar — mobile only, top-4 destinations. */
function MobileBottomNav() {
  const tabs = NAV_ITEMS.filter((i) => i.mobile)
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-abyss-950/85 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-neon-indigo' : 'text-slate-500 hover:text-slate-300',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive
                      ? 'rounded-lg bg-neon-indigo/15 px-3 py-0.5 shadow-neon-sm'
                      : 'px-3 py-0.5'
                  }
                >
                  <Icon size={19} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileHeader drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />

      <main className="px-4 pb-24 pt-6 sm:px-6 lg:ml-64 lg:pb-10 lg:pt-8">
        <div key={location.pathname} className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>

      <MobileBottomNav />
    </div>
  )
}
