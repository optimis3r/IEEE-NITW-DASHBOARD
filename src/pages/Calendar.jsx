import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import EventFormModal from '../components/events/EventFormModal'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`

export default function Calendar() {
  const { canEdit } = useAuth()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [events, setEvents] = useState([])
  const [modal, setModal] = useState(null)

  const monthStart = toISO(cursor)
  const monthEnd = toISO(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0))

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, status, start_time, description, end_time, venue')
      .gte('event_date', monthStart)
      .lte('event_date', monthEnd)
      .order('start_time', { ascending: true, nullsFirst: false })
    if (error) console.error(error.message)
    setEvents(data ?? [])
  }, [monthStart, monthEnd])

  useEffect(() => {
    load()
  }, [load])

  const byDate = useMemo(() => {
    const map = {}
    for (const e of events) (map[e.event_date] ??= []).push(e)
    return map
  }, [events])

  const cells = useMemo(() => {
    const firstWeekday = cursor.getDay()
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const list = Array.from({ length: firstWeekday }, () => null)
    for (let d = 1; d <= daysInMonth; d++) {
      list.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    }
    while (list.length % 7 !== 0) list.push(null)
    return list
  }, [cursor])

  const todayISO = toISO(new Date())
  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  function shiftMonth(delta) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="mt-1 text-sm text-slate-400">
            {canEdit ? 'Click a date to add an event' : 'Branch event schedule'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="glass !rounded-xl p-2 text-slate-300 hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="min-w-40 text-center text-sm font-semibold text-white">{monthLabel}</p>
          <button
            onClick={() => shiftMonth(1)}
            className="glass !rounded-xl p-2 text-slate-300 hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <div className="glass overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/10">
          {WEEKDAYS.map((d) => (
            <p key={d} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {d}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="min-h-20 border-b border-r border-white/5 sm:min-h-28" />
            const iso = toISO(date)
            const dayEvents = byDate[iso] ?? []
            const isToday = iso === todayISO
            return (
              <div
                key={i}
                onClick={() => canEdit && setModal({ event_date: iso })}
                className={`group relative min-h-20 border-b border-r border-white/5 p-1.5 transition-colors sm:min-h-28 sm:p-2 ${
                  canEdit ? 'cursor-pointer hover:bg-white/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? 'bg-neon-gradient font-bold text-white shadow-neon-sm'
                        : 'text-slate-400'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {canEdit && (
                    <Plus
                      size={13}
                      className="text-neon-indigo opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      onClick={(ev) => {
                        ev.stopPropagation()
                        if (canEdit) setModal(e)
                      }}
                      className={`block w-full truncate rounded-md border border-neon-indigo/30 bg-neon-indigo/15 px-1.5 py-0.5 text-left text-[10px] text-indigo-200 ${
                        canEdit ? 'hover:bg-neon-indigo/30' : 'cursor-default'
                      }`}
                      title={e.title}
                    >
                      {e.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="px-1 text-[10px] text-slate-500">+{dayEvents.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <EventFormModal
        open={modal !== null}
        initial={modal ?? {}}
        onClose={() => setModal(null)}
        onSaved={load}
      />
    </section>
  )
}
