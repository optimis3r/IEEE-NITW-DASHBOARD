import { useCallback, useEffect, useState } from 'react'
import { Plus, CalendarClock, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../lib/format'
import Modal from '../components/ui/Modal'
import { Field, SelectInput, StatusBadge } from '../components/ui/Field'

const COLUMNS = [
  { key: 'todo', label: 'Todo', glow: 'border-t-slate-400/40' },
  { key: 'in_progress', label: 'In Progress', glow: 'border-t-neon-blue/60' },
  { key: 'review', label: 'Review', glow: 'border-t-neon-violet/60' },
  { key: 'done', label: 'Done', glow: 'border-t-emerald-400/60' },
]
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

const EMPTY = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  assignee_id: '',
  due_date: '',
}

function TaskFormModal({ open, onClose, initial, profiles, onSaved, onDeleted }) {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initial, assignee_id: initial?.assignee_id ?? '' })
      setError('')
    }
  }, [open, initial])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      assignee_id: form.assignee_id || null,
      due_date: form.due_date || null,
    }
    const query = form.id
      ? supabase.from('tasks').update(payload).eq('id', form.id)
      : supabase.from('tasks').insert({ ...payload, created_by: user.id })
    const { error } = await query
    setSaving(false)
    if (error) return setError(error.message)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!window.confirm(`Delete task "${form.title}"?`)) return
    const { error } = await supabase.from('tasks').delete().eq('id', form.id)
    if (error) return setError(error.message)
    onDeleted()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'Edit task' : 'New task'}>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status">
            <SelectInput value={form.status} onChange={set('status')} options={COLUMNS.map((c) => c.key)} />
          </Field>
          <Field label="Priority">
            <SelectInput value={form.priority} onChange={set('priority')} options={PRIORITIES} />
          </Field>
          <Field label="Assignee">
            <select value={form.assignee_id} onChange={set('assignee_id')} className="glass-input appearance-none">
              <option value="" className="bg-abyss-900">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-abyss-900">
                  {p.full_name || p.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" className="glass-input" value={form.due_date ?? ''} onChange={set('due_date')} />
          </Field>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {form.id ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={14} /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-neon">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {form.id ? 'Save' : 'Create task'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default function Tasks() {
  const { canEdit } = useAuth()
  const [tasks, setTasks] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [modal, setModal] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const load = useCallback(async () => {
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email').order('full_name'),
    ])
    setTasks(t ?? [])
    setProfiles(p ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const nameOf = (id) => {
    const p = profiles.find((p) => p.id === id)
    return p ? p.full_name || p.email : null
  }

  async function moveTask(taskId, status) {
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, status } : t)))
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (error) {
      alert(error.message)
      load()
    }
  }

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board</h1>
          <p className="mt-1 text-sm text-slate-400">
            {canEdit ? 'Drag cards between columns, or tap a card to edit' : 'Team task overview'}
          </p>
        </div>
        {canEdit && (
          <button onClick={() => setModal({})} className="btn-neon">
            <Plus size={16} /> New task
          </button>
        )}
      </header>

      {!tasks ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-neon-indigo" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key)
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  if (!canEdit) return
                  e.preventDefault()
                  setDragOver(col.key)
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  if (!canEdit) return
                  e.preventDefault()
                  setDragOver(null)
                  const id = e.dataTransfer.getData('text/plain')
                  if (id) moveTask(id, col.key)
                }}
                className={`glass border-t-2 p-3 transition-all ${col.glow} ${
                  dragOver === col.key ? 'bg-white/10 shadow-neon-sm' : ''
                }`}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="text-sm font-semibold text-slate-200">{col.label}</p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={canEdit}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                      onClick={() => canEdit && setModal(task)}
                      className={`rounded-xl border border-white/10 bg-white/5 p-3 transition-all ${
                        canEdit ? 'cursor-grab hover:border-white/25 hover:bg-white/10 active:cursor-grabbing' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-100">{task.title}</p>
                        <StatusBadge value={task.priority} />
                      </div>
                      {(task.due_date || task.assignee_id) && (
                        <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          {task.due_date ? (
                            <span className="flex items-center gap-1">
                              <CalendarClock size={12} /> {formatDate(task.due_date)}
                            </span>
                          ) : (
                            <span />
                          )}
                          {task.assignee_id && (
                            <span className="truncate text-neon-indigo">{nameOf(task.assignee_id)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-slate-600">
                      No tasks
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TaskFormModal
        open={modal !== null}
        initial={modal ?? {}}
        profiles={profiles}
        onClose={() => setModal(null)}
        onSaved={load}
        onDeleted={load}
      />
    </section>
  )
}
