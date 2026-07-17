import { useEffect, useState } from 'react'
import { CalendarDays, AlertTriangle, Wallet, Shirt, Mic2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const STAT_CARDS = [
  { key: 'events', label: 'Upcoming events', icon: CalendarDays, accent: 'text-neon-blue' },
  { key: 'tasks', label: 'Urgent tasks', icon: AlertTriangle, accent: 'text-neon-violet' },
  { key: 'budget', label: 'Pending budgets', icon: Wallet, accent: 'text-neon-indigo' },
  { key: 'merch', label: 'Pending merch', icon: Shirt, accent: 'text-neon-cyan' },
  { key: 'speakers', label: 'Speaker follow-ups', icon: Mic2, accent: 'text-neon-blue' },
]

async function countRows(table, applyFilters) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  query = applyFilters(query)
  const { count, error } = await query
  if (error) {
    console.error(`Count failed for ${table}:`, error.message)
    return 0
  }
  return count ?? 0
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      countRows('events', (q) => q.eq('status', 'upcoming').gte('event_date', today)),
      countRows('tasks', (q) => q.eq('priority', 'urgent').neq('status', 'done')),
      countRows('budget_items', (q) => q.eq('status', 'pending')),
      countRows('merch_orders', (q) => q.eq('status', 'pending')),
      countRows('speakers', (q) => q.eq('status', 'follow_up')),
    ]).then(([events, tasks, budget, merch, speakers]) =>
      setStats({ events, tasks, budget, merch, speakers })
    )
  }, [])

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Live overview of IEEE NITW operations
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {STAT_CARDS.map(({ key, label, icon: Icon, accent }) => (
          <div key={key} className="glass glass-hover p-5">
            <Icon size={20} className={accent} />
            <p className="mt-4 text-3xl font-bold text-white tabular-nums">
              {stats ? stats[key] : '–'}
            </p>
            <p className="mt-1 text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
