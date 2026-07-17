import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, IndianRupee } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatINR } from '../lib/format'
import { SelectInput, StatusBadge } from '../components/ui/Field'

const BUDGET_STATUSES = ['pending', 'approved', 'partially_paid', 'paid', 'rejected']

/**
 * One ledger row. For editors, text/number cells are inline inputs that
 * persist on blur; status persists immediately on change.
 */
function Row({ item, canEdit, onSaved, onDelete }) {
  const [draft, setDraft] = useState(item)

  useEffect(() => setDraft(item), [item])

  async function persist(patch) {
    const { error } = await supabase.from('budget_items').update(patch).eq('id', item.id)
    if (error) {
      alert(error.message)
      setDraft(item)
    } else {
      onSaved()
    }
  }

  function blurSave(key, numeric = false) {
    const value = numeric ? Number(draft[key]) || 0 : draft[key]
    if (value !== item[key]) persist({ [key]: value })
  }

  const cell = (key, { numeric = false, className = '' } = {}) =>
    canEdit ? (
      <input
        type={numeric ? 'number' : 'text'}
        min={numeric ? 0 : undefined}
        step={numeric ? '0.01' : undefined}
        value={draft[key] ?? ''}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        onBlur={() => blurSave(key, numeric)}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className={`w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none transition-all hover:border-white/10 focus:border-neon-indigo/50 focus:bg-white/5 ${className}`}
      />
    ) : (
      <span className={`block px-2 py-1.5 text-sm ${className}`}>
        {numeric ? formatINR(item[key]) : item[key] || '—'}
      </span>
    )

  const pending = (Number(item.allocated_amount) || 0) - (Number(item.paid_amount) || 0)

  return (
    <tr className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
      <td className="min-w-44 py-1 pl-2">{cell('item_name')}</td>
      <td className="min-w-32 py-1">{cell('category')}</td>
      <td className="min-w-28 py-1 text-right">
        {cell('allocated_amount', { numeric: true, className: 'text-right tabular-nums' })}
      </td>
      <td className="min-w-28 py-1 text-right">
        {cell('paid_amount', { numeric: true, className: 'text-right tabular-nums' })}
      </td>
      <td
        className={`min-w-28 px-2 py-1 text-right text-sm tabular-nums ${
          pending > 0 ? 'text-amber-300' : 'text-emerald-300'
        }`}
      >
        {formatINR(pending)}
      </td>
      <td className="min-w-36 px-2 py-1">
        {canEdit ? (
          <SelectInput
            value={draft.status}
            onChange={(e) => {
              setDraft((d) => ({ ...d, status: e.target.value }))
              persist({ status: e.target.value })
            }}
            options={BUDGET_STATUSES}
            className="!px-2 !py-1.5 !text-xs"
          />
        ) : (
          <StatusBadge value={item.status} />
        )}
      </td>
      <td className="min-w-40 py-1">{cell('notes')}</td>
      {canEdit && (
        <td className="px-2 py-1">
          <button
            onClick={() => onDelete(item)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
            aria-label="Delete row"
          >
            <Trash2 size={14} />
          </button>
        </td>
      )}
    </tr>
  )
}

export default function Budget() {
  const { canEdit, user } = useAuth()
  const [items, setItems] = useState(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) console.error(error.message)
    setItems(data ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function addRow() {
    setAdding(true)
    const { error } = await supabase
      .from('budget_items')
      .insert({ item_name: 'New line item', category: 'general', created_by: user.id })
    setAdding(false)
    if (error) alert(error.message)
    else load()
  }

  async function deleteRow(item) {
    if (!window.confirm(`Delete "${item.item_name}" from the ledger?`)) return
    const { error } = await supabase.from('budget_items').delete().eq('id', item.id)
    if (error) alert(error.message)
    else load()
  }

  const totals = (items ?? []).reduce(
    (acc, i) => {
      acc.allocated += Number(i.allocated_amount) || 0
      acc.paid += Number(i.paid_amount) || 0
      return acc
    },
    { allocated: 0, paid: 0 }
  )

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget Ledger</h1>
          <p className="mt-1 text-sm text-slate-400">
            {canEdit ? 'Click any cell to edit inline — changes save on blur' : 'Branch financial overview'}
          </p>
        </div>
        {canEdit && (
          <button onClick={addRow} disabled={adding} className="btn-neon">
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add line item
          </button>
        )}
      </header>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total allocated', value: totals.allocated, tone: 'text-neon-blue' },
          { label: 'Total paid', value: totals.paid, tone: 'text-emerald-300' },
          { label: 'Pending', value: totals.allocated - totals.paid, tone: 'text-amber-300' },
        ].map(({ label, value, tone }) => (
          <div key={label} className="glass p-5">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <IndianRupee size={13} className={tone} /> {label}
            </p>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${tone}`}>{formatINR(value)}</p>
          </div>
        ))}
      </div>

      <div className="glass overflow-x-auto">
        {!items ? (
          <div className="flex justify-center py-16">
            <Loader2 size={26} className="animate-spin text-neon-indigo" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">The ledger is empty.</p>
        ) : (
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-2 py-3 font-semibold">Category</th>
                <th className="px-2 py-3 text-right font-semibold">Allocated</th>
                <th className="px-2 py-3 text-right font-semibold">Paid</th>
                <th className="px-2 py-3 text-right font-semibold">Pending</th>
                <th className="px-2 py-3 font-semibold">Status</th>
                <th className="px-2 py-3 font-semibold">Notes</th>
                {canEdit && <th className="px-2 py-3" />}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <Row key={item.id} item={item} canEdit={canEdit} onSaved={load} onDelete={deleteRow} />
              ))}
            </tbody>
            <tfoot>
              <tr className="text-sm font-semibold">
                <td className="px-4 py-3 text-slate-300" colSpan={2}>
                  Totals
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-neon-blue">
                  {formatINR(totals.allocated)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-emerald-300">
                  {formatINR(totals.paid)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-amber-300">
                  {formatINR(totals.allocated - totals.paid)}
                </td>
                <td colSpan={canEdit ? 3 : 2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </section>
  )
}
