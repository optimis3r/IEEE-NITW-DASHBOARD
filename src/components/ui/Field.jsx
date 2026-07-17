import { humanize } from '../../lib/format'

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}

export function SelectInput({ value, onChange, options, className = '' }) {
  return (
    <select
      value={value ?? ''}
      onChange={onChange}
      className={`glass-input appearance-none ${className}`}
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-abyss-900 text-slate-200">
          {humanize(opt)}
        </option>
      ))}
    </select>
  )
}

const BADGE_TONES = {
  // shared status → tone mapping across modules
  done: 'emerald', completed: 'emerald', paid: 'emerald', delivered: 'emerald',
  confirmed: 'emerald', accepted: 'emerald', approved: 'emerald',
  in_progress: 'blue', ongoing: 'blue', ordered: 'blue', in_production: 'blue',
  contacted: 'blue', interviewed: 'blue', partially_paid: 'blue', shortlisted: 'blue',
  review: 'violet', follow_up: 'violet', upcoming: 'violet',
  cancelled: 'red', rejected: 'red', declined: 'red', urgent: 'red',
  todo: 'slate', draft: 'slate', pending: 'amber', identified: 'slate',
  applied: 'slate', high: 'amber', medium: 'blue', low: 'slate',
  super_admin: 'violet', admin: 'blue', member: 'slate',
}

const TONE_CLASSES = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  red: 'bg-red-500/15 text-red-300 border-red-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  slate: 'bg-white/10 text-slate-300 border-white/15',
}

export function StatusBadge({ value }) {
  const tone = TONE_CLASSES[BADGE_TONES[value] ?? 'slate']
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {humanize(value)}
    </span>
  )
}
