/**
 * NAVIGATION HYPERSERVER
 * ──────────────────────
 * Central controller for ALL navigation in the app.
 * Edit here → updates sidebar, breadcrumbs, page titles, and route guards everywhere.
 */

export type UserRole = 'farmer' | 'admin' | 'researcher'

export interface NavItem {
  id:       string
  label:    string
  path:     string
  icon:     string          // emoji icon
  desc:     string          // short description shown in sidebar
  group:    NavGroup        // which section it belongs to
  roles:    UserRole[]      // who can see this
  badge?:   string          // optional badge text
  color:    string          // tailwind text color
  bg:       string          // tailwind bg color
  gradient: string          // tailwind gradient for active state
  external?: boolean
}

export type NavGroup =
  | 'main'
  | 'ai-tools'
  | 'my-data'
  | 'account'
  | 'admin'

export interface NavGroupConfig {
  id:     NavGroup
  label:  string
  emoji:  string
  roles:  UserRole[]
}

// ── Group definitions ─────────────────────────────────────────
export const NAV_GROUPS: NavGroupConfig[] = [
  { id: 'main',     label: 'Main',     emoji: '🏠', roles: ['farmer','admin','researcher'] },
  { id: 'ai-tools', label: 'AI Tools', emoji: '🤖', roles: ['farmer','admin','researcher'] },
  { id: 'my-data',  label: 'My Data',  emoji: '📊', roles: ['farmer','admin','researcher'] },
  { id: 'account',  label: 'Account',  emoji: '⚙️', roles: ['farmer','admin','researcher'] },
  { id: 'admin',    label: 'Admin',    emoji: '🛡️', roles: ['admin'] },
]

// ── All navigation items ──────────────────────────────────────
export const NAV_ITEMS: NavItem[] = [
  // ── Main ──────────────────────────────────────────────────
  {
    id: 'dashboard', label: 'Dashboard', path: '/dashboard',
    icon: '📊', desc: 'Overview & stats', group: 'main',
    roles: ['farmer','admin','researcher'],
    color: 'text-indigo-600', bg: 'bg-indigo-50',
    gradient: 'from-indigo-500 to-blue-600',
  },

  // ── AI Tools ──────────────────────────────────────────────
  {
    id: 'disease', label: 'Disease Detection', path: '/scan?type=disease',
    icon: '🔬', desc: 'Upload leaf photo', group: 'ai-tools',
    roles: ['farmer','admin','researcher'], badge: 'Popular',
    color: 'text-red-600', bg: 'bg-red-50',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    id: 'yield', label: 'Yield Prediction', path: '/scan?type=yield',
    icon: '📈', desc: 'Harvest forecast', group: 'ai-tools',
    roles: ['farmer','admin','researcher'],
    color: 'text-blue-600', bg: 'bg-blue-50',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'maturity', label: 'Maturity Check', path: '/scan?type=maturity',
    icon: '🌡️', desc: 'Brix & harvest timing', group: 'ai-tools',
    roles: ['farmer','admin','researcher'],
    color: 'text-green-600', bg: 'bg-green-50',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: 'pest', label: 'Pest Detection', path: '/scan?type=pest',
    icon: '🐛', desc: 'Pest severity level', group: 'ai-tools',
    roles: ['farmer','admin','researcher'],
    color: 'text-yellow-600', bg: 'bg-yellow-50',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'variety', label: 'Variety ID', path: '/scan?type=variety',
    icon: '🌾', desc: 'Identify variety', group: 'ai-tools',
    roles: ['farmer','admin','researcher'],
    color: 'text-purple-600', bg: 'bg-purple-50',
    gradient: 'from-purple-500 to-violet-600',
  },

  // ── My Data ───────────────────────────────────────────────
  {
    id: 'history', label: 'Scan History', path: '/history',
    icon: '📋', desc: 'Past results', group: 'my-data',
    roles: ['farmer','admin','researcher'],
    color: 'text-teal-600', bg: 'bg-teal-50',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'farm', label: 'My Farm', path: '/farm',
    icon: '🏡', desc: 'Farm profile & map', group: 'my-data',
    roles: ['farmer','admin','researcher'],
    color: 'text-orange-600', bg: 'bg-orange-50',
    gradient: 'from-orange-500 to-amber-500',
  },

  // ── Account ───────────────────────────────────────────────
  {
    id: 'settings', label: 'Settings', path: '/settings',
    icon: '⚙️', desc: 'Preferences', group: 'account',
    roles: ['farmer','admin','researcher'],
    color: 'text-gray-600', bg: 'bg-gray-100',
    gradient: 'from-gray-500 to-slate-600',
  },

  // ── Admin ─────────────────────────────────────────────────
  {
    id: 'admin-overview', label: 'Admin Overview', path: '/admin',
    icon: '🛡️', desc: 'System dashboard', group: 'admin',
    roles: ['admin'],
    color: 'text-rose-600', bg: 'bg-rose-50',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'admin-users', label: 'Manage Users', path: '/admin/users',
    icon: '👥', desc: 'All farmers & admins', group: 'admin',
    roles: ['admin'],
    color: 'text-rose-600', bg: 'bg-rose-50',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'admin-scans', label: 'All Scans', path: '/admin/scans',
    icon: '🔍', desc: 'System-wide scans', group: 'admin',
    roles: ['admin'],
    color: 'text-rose-600', bg: 'bg-rose-50',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'admin-models', label: 'Model Metrics', path: '/admin/models',
    icon: '🧠', desc: 'ML performance', group: 'admin',
    roles: ['admin'],
    color: 'text-rose-600', bg: 'bg-rose-50',
    gradient: 'from-rose-500 to-pink-600',
  },
]

// ── Helper functions ──────────────────────────────────────────

/** Get all nav items visible to a given role */
export function getNavForRole(role: UserRole | string): NavItem[] {
  return NAV_ITEMS.filter(item => item.roles.includes(role as UserRole))
}

/** Get nav items by group, filtered by role */
export function getNavGroup(group: NavGroup, role: UserRole | string): NavItem[] {
  return NAV_ITEMS.filter(item =>
    item.group === group && item.roles.includes(role as UserRole)
  )
}

/** Check if a path is accessible by a role */
export function canAccess(path: string, role: UserRole | string): boolean {
  const base = path.split('?')[0]
  return NAV_ITEMS.some(item =>
    item.path.split('?')[0] === base && item.roles.includes(role as UserRole)
  )
}

/** Find nav item by current path */
export function findActiveItem(pathname: string, search: string): NavItem | undefined {
  const full = pathname + search
  // Exact match first
  const exact = NAV_ITEMS.find(item => item.path === full)
  if (exact) return exact
  // Match by path only
  const pathOnly = NAV_ITEMS.find(item => item.path.split('?')[0] === pathname)
  if (pathOnly) return pathOnly
  // Match by search param
  if (search) {
    return NAV_ITEMS.find(item => item.path.includes(search.replace('?', '')))
  }
  return undefined
}

/** Get page title from path */
export function getPageTitle(pathname: string, search: string): string {
  const item = findActiveItem(pathname, search)
  return item?.label || 'SugarCane AI'
}

/** Get breadcrumbs for a path */
export function getBreadcrumbs(pathname: string, search: string): { label: string; path: string }[] {
  const item = findActiveItem(pathname, search)
  if (!item) return [{ label: 'Home', path: '/' }]

  const group = NAV_GROUPS.find(g => g.id === item.group)
  return [
    { label: 'Dashboard', path: '/dashboard' },
    ...(group && group.id !== 'main' ? [{ label: group.label, path: '' }] : []),
    { label: item.label, path: item.path },
  ]
}
