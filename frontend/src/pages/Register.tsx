import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../store/authSlice'
import { AppDispatch, RootState } from '../store'
import { Leaf, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const DISTRICTS = ['Morogoro Urban','Kilosa','Kilombero','Ulanga','Malinyi','Mvomero','Gairo']

export default function Register() {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '',
    region: 'Morogoro', district: ''
  })
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { loading, user } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    if (user || localStorage.getItem('access_token')) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await dispatch(register(form))
    if (register.fulfilled.match(result)) {
      toast.success('Account created! Welcome 🌿')
      navigate('/dashboard')
    } else {
      toast.error(result.payload as string || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-float-slow" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-green-300 hover:text-white transition mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Create Free Account</h1>
            <p className="text-gray-500 mt-1 text-sm">For farmers in Morogoro, Tanzania 🇹🇿</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name *</label>
              <input type="text" required className="input" placeholder="John Mwanga"
                value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email *</label>
              <input type="email" required className="input" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone</label>
                <input type="tel" className="input" placeholder="+255 712..."
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">District</label>
                <select className="input" value={form.district} onChange={e => set('district', e.target.value)}>
                  <option value="">Select</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Password *</label>
              <input type="password" required minLength={6} className="input" placeholder="Min 6 characters"
                value={form.password} onChange={e => set('password', e.target.value)} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Creating...</>
                : '🌿 Create Free Account'}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 font-bold hover:underline">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
