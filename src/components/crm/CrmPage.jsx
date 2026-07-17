import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Loader2, FileDown, Upload, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { humanize } from '../../lib/format'
import Modal from '../ui/Modal'
import { Field, SelectInput, StatusBadge } from '../ui/Field'

/**
 * Generic filterable CRUD table for the CRM modules.
 *
 * Field def: {
 *   key, label,
 *   type: 'text' | 'textarea' | 'number' | 'select' | 'file' | 'url',
 *   options: [...]        (for select)
 *   required: bool, inTable: bool (default true), searchable: bool
 * }
 * 'file' fields store a Supabase Storage path in the crm-files bucket;
 * the table renders a signed-URL download button for them.
 */

async function uploadFile(table, file) {
  const safeName = file.name.replace(/[^\w.-]+/g, '_')
  const path = `${table}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from('crm-files').upload(path, file)
  if (error) throw error
  return path
}

function FileCell({ path }) {
  const [busy, setBusy] = useState(false)
  if (!path) return <span className="text-slate-600">—</span>

  async function download() {
    setBusy(true)
    const { data, error } = await supabase.storage.from('crm-files').createSignedUrl(path, 3600)
    setBusy(false)
    if (error) alert(error.message)
    else window.open(data.signedUrl, '_blank', 'noopener')
  }

  return (
    <button
      onClick={download}
      disabled={busy}
      className="flex items-center gap-1.5 rounded-lg border border-neon-indigo/30 bg-neon-indigo/10 px-2.5 py-1 text-[11px] text-indigo-200 hover:bg-neon-indigo/25"
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
      Open
    </button>
  )
}

function RecordModal({ open, onClose, table, fields, initial, onSaved }) {
  const { user } = useAuth()
  const [form, setForm] = useState({})
  const [files, setFiles] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      const base = {}
      for (const f of fields) base[f.key] = initial?.[f.key] ?? (f.type === 'select' ? f.options[0] : '')
      setForm({ ...base, id: initial?.id })
      setFiles({})
      setError('')
    }
  }, [open, initial, fields])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {}
      for (const f of fields) {
        if (f.type === 'file') {
          if (files[f.key]) payload[f.key] = await uploadFile(table, files[f.key])
        } else if (f.type === 'number') {
          payload[f.key] = Number(form[f.key]) || 0
        } else {
          payload[f.key] = form[f.key] === '' && f.type === 'url' ? null : form[f.key]
        }
      }
      const query = form.id
        ? supabase.from(table).update(payload).eq('id', form.id)
        : supabase.from(table).insert({ ...payload, created_by: user.id })
      const { error } = await query
      if (error) throw error
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'Edit record' : 'New record'} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
              {f.type === 'select' ? (
                <SelectInput value={form[f.key]} onChange={set(f.key)} options={f.options} />
              ) : f.type === 'textarea' ? (
                <textarea rows={3} className="glass-input resize-none" value={form[f.key] ?? ''} onChange={set(f.key)} />
              ) : f.type === 'file' ? (
                <div>
                  <label className="glass-input flex cursor-pointer items-center gap-2 text-slate-400">
                    <Upload size={14} className="shrink-0 text-neon-indigo" />
                    <span className="truncate text-xs">
                      {files[f.key]?.name ?? (form[f.key] ? 'Replace current file…' : 'Choose file…')}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFiles((prev) => ({ ...prev, [f.key]: e.target.files[0] }))}
                    />
                  </label>
                </div>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  min={f.type === 'number' ? 0 : undefined}
                  step={f.type === 'number' ? '0.01' : undefined}
                  required={f.required}
                  className="glass-input"
                  value={form[f.key] ?? ''}
                  onChange={set(f.key)}
                />
              )}
            </Field>
          ))}
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
            {form.id ? 'Save changes' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function CrmPage({ table, title, description, fields }) {
  const { canEdit } = useAuth()
  const [rows, setRows] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)

  const statusField = fields.find((f) => f.key === 'status')
  const tableFields = fields.filter((f) => f.inTable !== false)
  const searchKeys = fields.filter((f) => f.searchable).map((f) => f.key)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    if (error) console.error(error.message)
    setRows(data ?? [])
  }, [table])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(row) {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    const { error } = await supabase.from(table).delete().eq('id', row.id)
    if (error) alert(error.message)
    else load()
  }

  const visible = rows?.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q))
  })

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        {canEdit && (
          <button onClick={() => setModal({})} className="btn-neon">
            <Plus size={16} /> Add record
          </button>
        )}
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-3 text-slate-500" />
          <input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input !pl-10"
          />
        </div>
        {statusField && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input w-auto appearance-none"
          >
            <option value="all" className="bg-abyss-900">All statuses</option>
            {statusField.options.map((s) => (
              <option key={s} value={s} className="bg-abyss-900">
                {humanize(s)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="glass overflow-x-auto">
        {!visible ? (
          <div className="flex justify-center py-16">
            <Loader2 size={26} className="animate-spin text-neon-indigo" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">No records found.</p>
        ) : (
          <table className="w-full min-w-max text-left">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                {tableFields.map((f) => (
                  <th key={f.key} className="px-4 py-3 font-semibold">
                    {f.label}
                  </th>
                ))}
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
                  {tableFields.map((f) => (
                    <td key={f.key} className="max-w-64 truncate px-4 py-3 text-sm text-slate-300">
                      {f.type === 'select' ? (
                        <StatusBadge value={row[f.key]} />
                      ) : f.type === 'file' ? (
                        <FileCell path={row[f.key]} />
                      ) : f.type === 'url' && row[f.key] ? (
                        <a
                          href={row[f.key]}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-neon-indigo hover:underline"
                        >
                          Link <ExternalLink size={12} />
                        </a>
                      ) : (
                        row[f.key] || <span className="text-slate-600">—</span>
                      )}
                    </td>
                  ))}
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setModal(row)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RecordModal
        open={modal !== null}
        onClose={() => setModal(null)}
        table={table}
        fields={fields}
        initial={modal}
        onSaved={load}
      />
    </section>
  )
}
