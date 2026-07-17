import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Copy, MapPin, Clock, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatDate, humanize } from '../lib/format'
import { StatusBadge } from '../components/ui/Field'
import EventFormModal from '../components/events/EventFormModal'

const FILTERS = ['all', 'draft', 'upcoming', 'ongoing', 'completed', 'cancelled']

export default function Events() {
  const { canEdit, user } = useAuth()
  const [events, setEvents] = useState(null)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null) // initial record for EventFormModal

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
    if (error) console.error(error.message)
    setEvents(data ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(event) {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    const { error } = await supabase.from('events').delete().eq('id', event.id)
    if (error) alert(error.message)
    else load()
  }

  async function handleDuplicate(event) {
    const { id, created_at, updated_at, ...rest } = event
    const { error } = await supabase
      .from('events')
      .insert({ ...rest, title: `${event.title} (copy)`, status: 'draft', created_by: user.id })
    if (error) alert(error.message)
    else load()
  }

  const visible = events?.filter((e) => filter === 'all' || e.status === filter)

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="mt-1 text-sm text-slate-400">Plan and track branch events</p>
        </div>
        {canEdit && (
          <button onClick={() => setModal({})} className="btn-neon">
            <Plus size={16} /> New event
          </button>
        )}
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
              filter === f
                ? 'border-neon-indigo/50 bg-neon-indigo/15 text-neon-indigo shadow-neon-sm'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : humanize(f)}
          </button>
        ))}
      </div>

      {!visible ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-neon-indigo" />
        </div>
      ) : visible.length === 0 ? (
        <div className="glass p-12 text-center text-sm text-slate-400">
          No events{filter !== 'all' ? ` with status “${humanize(filter)}”` : ' yet'}.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((event) => (
            <article key={event.id} className="glass glass-hover flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="font-semibold text-white">{event.title}</h2>
                <StatusBadge value={event.status} />
              </div>

              <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-400">
                {event.description || 'No description.'}
              </p>

              <div className="space-y-1.5 text-xs text-slate-400">
                <p className="flex items-center gap-2">
                  <Clock size={13} className="text-neon-indigo" />
                  {formatDate(event.event_date)}
                  {event.start_time && ` · ${event.start_time.slice(0, 5)}`}
                  {event.end_time && `–${event.end_time.slice(0, 5)}`}
                </p>
                {event.venue && (
                  <p className="flex items-center gap-2">
                    <MapPin size={13} className="text-neon-indigo" />
                    {event.venue}
                  </p>
                )}
              </div>

              {canEdit && (
                <div className="mt-4 flex gap-1 border-t border-white/10 pt-3">
                  <button
                    onClick={() => setModal(event)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(event)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                  >
                    <Copy size={13} /> Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(event)}
                    className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <EventFormModal
        open={modal !== null}
        initial={modal ?? {}}
        onClose={() => setModal(null)}
        onSaved={load}
      />
    </section>
  )
}
