import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Zap, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neon-gradient shadow-neon animate-pulse-glow">
            <Zap size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">IEEE NITW Operations</h1>
            <p className="mt-1 text-sm text-slate-400">
              Sign in with your provisioned account
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-3.5 text-slate-500" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@student.nitw.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input !pl-11"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-4 top-3.5 text-slate-500" />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input !pl-11"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-neon w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          No public sign-up — accounts are provisioned by the webmaster.
        </p>
      </div>
    </div>
  )
}
