import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../store/authSlice'
import { AppDispatch, RootState } from '../store'
import { Leaf, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const dispatch  = useDispatch<AppDispatch>()
  const navigate  = useNavigate()
  const { loading, user } = useSelector((s: RootState) => s.auth)

  // Already logged in → go to dashboard
  useEffect(() => {
    if (user || localStorage.getItem('access_token')) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await dispatch(login(form))
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back! 🌿')
      navigate('/dashboard')
    } else {
      toast.error(result.payload as string || 'Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-float-slow" />

      {/* Floating decorations */}
      <div className="absolute top-16 right-20 text-4xl animate-float opacity-40 hidden lg:block" style={{animationDelay:'0.5s'}}>🌿</div>
      <div className="absolute bottom-24 left-16 text-3xl animate-float-slow opacity-30 hidden lg:block" style={{animationDelay:'1s'}}>🌾</div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-2 text-green-300 hover:text-white transition mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-1 text-sm">Sign in to SugarCane AI</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email address</label>
              <input type="email" required className="input" autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required className="input pr-11"
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Signing in...</>
                : '🌿 Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3.5 bg-green-50 rounded-2xl border border-green-100">
            <p className="text-xs font-bold text-green-700 mb-1.5">Demo Accounts:</p>
            <div className="space-y-1">
              <button type="button" onClick={() => setForm({ email:'demo@sugarcane.tz', password:'farmer123' })}
                className="w-full text-left text-xs text-green-600 hover:text-green-800 font-mono bg-white rounded-lg px-2.5 py-1.5 hover:bg-green-50 transition border border-green-100">
                👨‍🌾 farmer@sugarcane.tz / farmer123
              </button>
            </div>
          </div>

          <p className="text-center mt-5 text-sm text-gray-600">
            No account?{' '}
            <Link to="/register" className="text-green-600 font-bold hover:text-green-700 hover:underline">
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
