import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from './store/authSlice'
import { AppDispatch, RootState } from './store'
import { canAccess } from './utils/navConfig'

import Home         from './pages/Home'
import Login        from './pages/Login'
import Register     from './pages/Register'
import Dashboard    from './pages/Dashboard'
import Scan         from './pages/Scan'
import History      from './pages/History'
import Farm         from './pages/Farm'
import SettingsPage from './pages/Settings'
import AdminPage    from './pages/Admin'
import Layout       from './components/common/Layout'

/** Wraps a page: checks auth + role access */
function Guard({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const token = localStorage.getItem('access_token')
  const { user, loading } = useSelector((s: RootState) => s.auth)
  const location = useLocation()

  // Not logged in at all
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />

  // Still loading user from token — show spinner, don't flash content
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  )

  // Admin-only check after user is loaded
  if (adminOnly && user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function PrivatePage({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  return (
    <Guard adminOnly={adminOnly}>
      <Layout>{children}</Layout>
    </Guard>
  )
}

export default function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (localStorage.getItem('access_token')) dispatch(fetchMe())
  }, [dispatch])

  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<Home />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Farmer routes */}
      <Route path="/dashboard" element={<PrivatePage><Dashboard /></PrivatePage>} />
      <Route path="/scan"      element={<PrivatePage><Scan /></PrivatePage>} />
      <Route path="/history"   element={<PrivatePage><History /></PrivatePage>} />
      <Route path="/farm"      element={<PrivatePage><Farm /></PrivatePage>} />
      <Route path="/settings"  element={<PrivatePage><SettingsPage /></PrivatePage>} />

      {/* Admin routes — all under /admin/* */}
      <Route path="/admin"        element={<PrivatePage adminOnly><AdminPage /></PrivatePage>} />
      <Route path="/admin/users"  element={<PrivatePage adminOnly><AdminPage /></PrivatePage>} />
      <Route path="/admin/scans"  element={<PrivatePage adminOnly><AdminPage /></PrivatePage>} />
      <Route path="/admin/models" element={<PrivatePage adminOnly><AdminPage /></PrivatePage>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
