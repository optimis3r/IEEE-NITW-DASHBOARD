import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Events from './pages/Events'
import Tasks from './pages/Tasks'
import Budget from './pages/Budget'
import Merch from './pages/Merch'
import Speakers from './pages/Speakers'
import Recruitment from './pages/Recruitment'
import Resources from './pages/Resources'
import Team from './pages/Team'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 size={32} className="animate-spin text-neon-indigo" />
    </div>
  )
}

/** Gate: renders child routes only for authenticated users. */
function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/events" element={<Events />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/merch" element={<Merch />} />
              <Route path="/speakers" element={<Speakers />} />
              <Route path="/recruitment" element={<Recruitment />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/team" element={<Team />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
