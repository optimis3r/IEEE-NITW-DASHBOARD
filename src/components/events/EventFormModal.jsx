import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import { Field, SelectInput } from '../ui/Field'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const EVENT_STATUSES = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled']

const EMPTY = {
  title: '',
  description: '',
  event_date: '',
  start_time: '',
  end_time: '',
  venue: '',
  status: 'upcoming',
}

/**
 * Create/edit modal for events. Pass `initial` with an `id` to edit;
 * without an `id` (e.g. just { event_date }) it creates a new event.
 */
export default function EventFormModal({ open, onClose, initial, onSaved }) {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initial })
      setError('')
    }
  }, [open, initial])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      title: form.title,
      description: form.description,
      event_date: form.event_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      venue: form.venue,
      status: form.status,
    }
    const query = form.id
      ? supabase.from('events').update(payload).eq('id', form.id)
      : supabase.from('events').insert({ ...payload, created_by: user.id })
    const { error } = await query
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved?.()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'Edit event' : 'New event'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title">
          <input required className="glass-input" value={form.title} onChange={set('title')} />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            className="glass-input resize-none"
            value={form.description ?? ''}
            onChange={set('description')}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Date">
            <input
              type="date"
              required
              className="glass-input"
              value={form.event_date ?? ''}
              onChange={set('event_date')}
            />
          </Field>
          <Field label="Start">
            <input
              type="time"
              className="glass-input"
              value={form.start_time ?? ''}
              onChange={set('start_time')}
            />
          </Field>
          <Field label="End">
            <input
              type="time"
              className="glass-input"
              value={form.end_time ?? ''}
              onChange={set('end_time')}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Venue">
            <input className="glass-input" value={form.venue ?? ''} onChange={set('venue')} />
          </Field>
          <Field label="Status">
            <SelectInput value={form.status} onChange={set('status')} options={EVENT_STATUSES} />
          </Field>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-neon">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {form.id ? 'Save changes' : 'Create event'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
