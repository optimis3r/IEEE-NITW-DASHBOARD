import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck, Loader2, Info } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { SelectInput, StatusBadge } from '../components/ui/Field'
import { humanize } from '../lib/format'

const ROLES = ['member', 'admin', 'super_admin']

export default function Team() {
  const { isSuperAdmin, user, refreshProfile } = useAuth()
  const [members, setMembers] = useState(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role')
      .order('full_name')
    if (error) console.error(error.message)
    setMembers(data ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function changeRole(member, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', member.id)
    if (error) alert(error.message)
    else {
      load()
      refreshProfile()
    }
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Team</h1>
        <p className="mt-1 text-sm text-slate-400">
          {isSuperAdmin ? 'Manage member roles' : 'Branch members and roles'}
        </p>
      </header>

      {isSuperAdmin && (
        <div className="glass mb-5 flex items-start gap-3 !rounded-xl border-neon-indigo/20 p-4 text-sm text-slate-300">
          <Info size={16} className="mt-0.5 shrink-0 text-neon-indigo" />
          <p>
            New accounts are provisioned in the Supabase dashboard (Authentication → Users →
            “Add user”) and appear here as <em>member</em>. Promote them below. You cannot change
            your own role — ask another super admin if needed.
          </p>
        </div>
      )}

      <div className="glass overflow-x-auto">
        {!members ? (
          <div className="flex justify-center py-16">
            <Loader2 size={26} className="animate-spin text-neon-indigo" />
          </div>
        ) : (
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-sm text-slate-200">
                    <span className="flex items-center gap-2">
                      {m.role === 'super_admin' && <ShieldCheck size={14} className="text-neon-indigo" />}
                      {m.full_name || '—'}
                      {m.id === user.id && <span className="text-[11px] text-slate-500">(you)</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{m.email}</td>
                  <td className="px-4 py-3">
                    {isSuperAdmin && m.id !== user.id ? (
                      <SelectInput
                        value={m.role}
                        onChange={(e) => changeRole(m, e.target.value)}
                        options={ROLES}
                        className="!w-44 !px-2.5 !py-1.5 !text-xs"
                      />
                    ) : (
                      <StatusBadge value={m.role} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
