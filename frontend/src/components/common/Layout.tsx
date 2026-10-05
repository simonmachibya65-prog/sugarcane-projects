import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/authSlice'
import { RootState } from '../../store'
import { LogOut, Menu, X, Leaf, ChevronRight, Bell, Settings } from 'lucide-react'
import {
  NAV_GROUPS, getNavGroup, getPageTitle, getBreadcrumbs,
  findActiveItem, type NavItem
} from '../../utils/navConfig'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((s: RootState) => s.auth)

  const role = user?.role || 'farmer'
  const pageTitle = getPageTitle(location.pathname, location.search)
  const breadcrumbs = getBreadcrumbs(location.pathname, location.search)
  const activeItem = findActiveItem(location.pathname, location.search)

  const handleLogout = () => { dispatch(logout()); navigate('/') }

  const isActive = (item: NavItem) => {
    const itemPath = item.path.split('?')[0]
    const itemSearch = item.path.includes('?') ? '?' + item.path.split('?')[1] : ''
    return location.pathname === itemPath &&
      (!itemSearch || location.search.startsWith(itemSearch))
  }

  // ── Single nav item ────────────────────────────────────────
  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item)
    return (
      <Link to={item.path} onClick={() => setOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative
          ${active
            ? `bg-gradient-to-r ${item.gradient} text-white shadow-md`
            : `text-gray-600 hover:bg-gray-50 hover:text-gray-900`}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-all
          ${active ? 'bg-white/20' : `${item.bg} group-hover:scale-110`}`}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate leading-tight ${active ? 'text-white' : ''}`}>
            {item.label}
          </p>
          <p className={`text-xs truncate ${active ? 'text-white/70' : 'text-gray-400'}`}>
            {item.desc}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.badge && !active && (
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${item.bg} ${item.color}`}>
              {item.badge}
            </span>
          )}
          {active && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
        </div>
      </Link>
    )
  }

  // ── Sidebar content ────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full select-none">

      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Link to="/dashboard" onClick={() => setOpen(false)}
          className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-gray-900 leading-tight">SugarCane AI</p>
            <p className="text-xs text-gray-400 font-medium">Morogoro, Tanzania 🇹🇿</p>
          </div>
        </Link>
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_GROUPS.map(group => {
          const items = getNavGroup(group.id, role)
          if (!items.length) return null
          return (
            <div key={group.id}>
              {group.id !== 'main' && (
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-2 mt-3 mb-0.5 flex items-center gap-1.5">
                  <span>{group.emoji}</span> {group.label}
                </p>
              )}
              {items.map(item => <NavLink key={item.id} item={item} />)}
            </div>
          )
        })}
      </div>

      {/* User profile */}
      <div className="px-3 pb-3 pt-3 border-t border-gray-100">
        <Link to="/settings" onClick={() => setOpen(false)}
          className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all mb-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || 'F'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.full_name || 'Farmer'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.region || 'Morogoro'}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full
              ${role === 'admin' ? 'bg-rose-100 text-rose-600' : 'bg-green-100 text-green-600'}`}>
              {role}
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all group">
          <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col shadow-sm shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-slide-left z-10">
            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition z-20">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
          {/* Left: hamburger + breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              {/* Breadcrumbs */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
                {breadcrumbs.map((bc, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="w-3 h-3" />}
                    {bc.path && i < breadcrumbs.length - 1
                      ? <Link to={bc.path} className="hover:text-green-600 transition font-medium">{bc.label}</Link>
                      : <span className={i === breadcrumbs.length - 1 ? 'text-gray-600 font-semibold' : ''}>{bc.label}</span>}
                  </span>
                ))}
              </div>
              {/* Page title with active item icon */}
              <div className="flex items-center gap-2">
                {activeItem && (
                  <span className="text-lg leading-none">{activeItem.icon}</span>
                )}
                <h1 className="font-black text-gray-900 text-lg leading-none truncate">
                  {pageTitle}
                </h1>
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Date */}
            <span className="hidden md:block text-xs text-gray-400 font-medium">
              {new Date().toLocaleDateString('en-TZ', { weekday:'short', month:'short', day:'numeric' })}
            </span>

            {/* Notifications bell */}
            <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center relative hover:bg-gray-200 transition">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>

            {/* Settings shortcut */}
            <Link to="/settings"
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
              <Settings className="w-4 h-4 text-gray-600" />
            </Link>

            {/* Avatar */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-black">
                {user?.full_name?.[0]?.toUpperCase() || 'F'}
              </div>
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                {user?.full_name?.split(' ')[0] || 'Farmer'}
              </span>
              {role === 'admin' && (
                <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">ADMIN</span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
