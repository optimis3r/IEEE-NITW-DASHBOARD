import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  KanbanSquare,
  Wallet,
  Shirt,
  Mic2,
  UserPlus,
  FolderOpen,
  Users,
} from 'lucide-react'

// Single source of truth for routes: consumed by the router (App.jsx),
// the desktop sidebar, and the mobile bottom bar / drawer.
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, mobile: true },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays, mobile: true },
  { path: '/events', label: 'Events', icon: Sparkles, mobile: true },
  { path: '/tasks', label: 'Tasks', icon: KanbanSquare, mobile: true },
  { path: '/budget', label: 'Budget', icon: Wallet, mobile: false },
  { path: '/merch', label: 'Merch', icon: Shirt, mobile: false },
  { path: '/speakers', label: 'Speakers', icon: Mic2, mobile: false },
  { path: '/recruitment', label: 'Recruitment', icon: UserPlus, mobile: false },
  { path: '/resources', label: 'Resources', icon: FolderOpen, mobile: false },
  { path: '/team', label: 'Team', icon: Users, mobile: false },
]
