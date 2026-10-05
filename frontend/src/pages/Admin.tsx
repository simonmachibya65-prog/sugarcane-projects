import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { adminAPI } from '../utils/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts'
import {
  Users, Camera, CheckCircle, Activity, Database,
  RefreshCw, Shield, Search, Eye, UserCheck, UserX,
  ChevronRight, ArrowUp, AlertTriangle, Zap, TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#16a34a','#ef4444','#f59e0b','#3b82f6','#8b5cf6','#ec4899']
type Tab = 'overview' | 'users' | 'scans' | 'models'

export default function AdminPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [tab, setTab]       = useState<Tab>('overview')
  const [data, setData]     = useState<any>(null)
  const [trends, setTrends] = useState<any[]>([])
  const [users, setUsers]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [d, t, u] = await Promise.all([
        adminAPI.dashboard(), adminAPI.diseaseTrends(), adminAPI.users()
      ])
      setData(d.data); setTrends(t.data); setUsers(u.data)
    } catch { toast.error('Failed to load admin data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const hash = location.hash.replace('#','') as Tab
    if (['overview','users','scans','models'].includes(hash)) setTab(hash)
  }, [location.hash])

  const setTabUrl = (t: Tab) => { setTab(t); navigate(`/admin#${t}`, { replace: true }) }

  const handleRefresh = async () => {
    setRefreshing(true); await load(); setRefreshing(false)
    toast.success('Data refreshed!')
  }

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading(userId)
    try {
      await adminAPI.changeRole(userId, role)
      setUsers(u => u.map(x => x.id === userId ? { ...x, role } : x))
      toast.success(`Role changed to ${role}`)
    } catch { toast.error('Failed to change role') }
    finally { setActionLoading(null) }
  }

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId)
    try {
      await adminAPI.toggleUser(userId)
      setUsers(u => u.map(x => x.id === userId ? { ...x, is_active: !x.is_active } : x))
      toast.success(currentStatus ? 'User disabled' : 'User enabled')
    } catch { toast.error('Failed to update user') }
    finally { setActionLoading(null) }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 font-semibold">Loading admin panel...</p>
    </div>
  )

  const diseasePie = data?.disease_distribution
    ? Object.entries(data.disease_distribution).map(([name,value]) => ({name,value})) : []
  const scanTypesData = data?.scan_types
    ? Object.entries(data.scan_types).map(([name,value]) => ({name:name.replace('_',' '),value})) : []
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.region?.toLowerCase().includes(search.toLowerCase())
  )
  const modelMetrics = [
    {name:'Disease Detection',model:'EfficientNetB0',accuracy:95,type:'CNN',         scans:data?.scan_types?.disease||0,          color:'from-red-500 to-rose-600'},
    {name:'Yield Prediction', model:'LightGBM',      accuracy:90,type:'Regressor',   scans:data?.scan_types?.yield_prediction||0,  color:'from-blue-500 to-indigo-600'},
    {name:'Pest Detection',   model:'GradientBoost', accuracy:57,type:'Classifier',  scans:data?.scan_types?.pest||0,              color:'from-amber-500 to-orange-500'},
    {name:'Maturity Check',   model:'RandomForest',  accuracy:40,type:'Regressor',   scans:data?.scan_types?.maturity||0,          color:'from-green-500 to-emerald-600'},
    {name:'Variety ID',       model:'XGBoost',       accuracy:35,type:'Classifier',  scans:data?.scan_types?.variety||0,           color:'from-purple-500 to-violet-600'},
  ]

  const TABS = [
    {id:'overview' as Tab, label:'Overview',    icon:'📊'},
    {id:'users'    as Tab, label:'Users',        icon:'👥'},
    {id:'scans'    as Tab, label:'Scans & Data', icon:'🔍'},
    {id:'models'   as Tab, label:'ML Models',    icon:'🧠'},
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Admin Control Panel</h1>
            <p className="text-gray-500 text-sm">SugarCane AI — Morogoro, Tanzania 🇹🇿</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold hover:border-rose-300 hover:text-rose-600 transition-all disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="flex gap-1.5 bg-gray-100/80 p-1.5 rounded-2xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTabUrl(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
              ${tab === t.id
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════ OVERVIEW ══════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:'Total Users',   value:data?.total_users||0,         gradient:'from-blue-500 to-indigo-600',   icon:Users,       change:'+12%'},
              {label:'Total Scans',   value:data?.total_scans||0,         gradient:'from-green-500 to-emerald-600', icon:Camera,      change:'+8%'},
              {label:'Feedback Acc.', value:`${data?.user_accuracy||0}%`, gradient:'from-purple-500 to-violet-600', icon:CheckCircle, change:'+3%'},
              {label:'Active Models', value:5,                            gradient:'from-rose-500 to-pink-600',     icon:Database,    change:'Live'},
            ].map(({label,value,gradient,icon:Icon,change}) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                <p className="text-xs font-bold text-green-600 mt-1.5 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />{change}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">🔬 Disease Distribution</h3>
              {diseasePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={diseasePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {diseasePie.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-44 text-gray-300">
                  <Camera className="w-12 h-12 mb-2" />
                  <p className="text-sm">No disease scans yet</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">📊 Scans by Type</h3>
              {scanTypesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={scanTypesData} barSize={36}>
                    <XAxis dataKey="name" tick={{fontSize:10}} />
                    <YAxis tick={{fontSize:10}} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6,6,0,0]}>
                      {scanTypesData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-44 text-gray-300">
                  <Activity className="w-12 h-12 mb-2" />
                  <p className="text-sm">No scan data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Trend chart */}
          {trends.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">📈 Scan Activity Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trends.slice(0,30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{fontSize:10}} />
                  <YAxis tick={{fontSize:10}} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16a34a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* System health */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600" /> System Health
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {label:'API Server',  status:'Online',   color:'green', icon:'🟢'},
                {label:'Database',    status:'Online',   color:'green', icon:'🟢'},
                {label:'ML Models',   status:'5 Active', color:'blue',  icon:'🔵'},
                {label:'Storage',     status:'4.8 GB',   color:'yellow',icon:'🟡'},
              ].map(s => (
                <div key={s.label} className={`bg-${s.color}-50 rounded-2xl p-4 border border-${s.color}-100`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{s.icon}</span>
                    <span className="text-xs font-semibold text-gray-600">{s.label}</span>
                  </div>
                  <p className={`text-sm font-black text-${s.color}-700`}>{s.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ USERS ═════════════════════════════ */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Search + count */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name, email or region..."
                className="input pl-10 bg-white"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" /> {filteredUsers.length} users
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Farmer','Email','Region','Role','Status','Joined','Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-black text-gray-500 uppercase tracking-wider px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No users found</p>
                    </td></tr>
                  ) : filteredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm
                            ${u.role === 'admin' ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                            {u.name?.[0]?.toUpperCase() || 'F'}
                          </div>
                          <span className="font-semibold text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{u.email}</td>
                      <td className="px-5 py-4 text-gray-500">{u.region || 'Morogoro'}</td>
                      <td className="px-5 py-4">
                        <select
                          value={u.role || 'farmer'}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          disabled={actionLoading === u.id}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border-2 cursor-pointer transition-all
                            ${u.role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : u.role === 'researcher' ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-green-50 text-green-700 border-green-200'}`}>
                          <option value="farmer">👨‍🌾 Farmer</option>
                          <option value="researcher">🔬 Researcher</option>
                          <option value="admin">🛡️ Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full
                          ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active !== false ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          {u.is_active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {u.joined ? new Date(u.joined).toLocaleDateString('en-TZ', {day:'numeric',month:'short',year:'numeric'}) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleUser(u.id, u.is_active !== false)}
                          disabled={actionLoading === u.id}
                          className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all
                            ${u.is_active !== false
                              ? 'text-red-600 bg-red-50 hover:bg-red-100'
                              : 'text-green-600 bg-green-50 hover:bg-green-100'}`}>
                          {actionLoading === u.id
                            ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : u.is_active !== false ? <><UserX className="w-3.5 h-3.5" /> Disable</> : <><UserCheck className="w-3.5 h-3.5" /> Enable</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ SCANS ═════════════════════════════ */}
      {tab === 'scans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {label:'Disease',  key:'disease',          emoji:'🔬', gradient:'from-red-500 to-rose-600'},
              {label:'Yield',    key:'yield_prediction', emoji:'📈', gradient:'from-blue-500 to-indigo-600'},
              {label:'Maturity', key:'maturity',         emoji:'🌡️', gradient:'from-green-500 to-emerald-600'},
              {label:'Pest',     key:'pest',             emoji:'🐛', gradient:'from-amber-500 to-orange-500'},
              {label:'Variety',  key:'variety',          emoji:'🌾', gradient:'from-purple-500 to-violet-600'},
            ].map(({label,key,emoji,gradient}) => (
              <div key={key} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                  <span className="text-xl">{emoji}</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{data?.scan_types?.[key]||0}</p>
                <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Disease breakdown */}
          {diseasePie.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-5">🔬 Disease Breakdown</h3>
              <div className="space-y-3">
                {diseasePie.map((d:any, i) => {
                  const total = diseasePie.reduce((s:number,x:any) => s+x.value, 0)
                  const pct = total ? Math.round(d.value/total*100) : 0
                  return (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{background:COLORS[i%COLORS.length]}} />
                      <span className="text-sm font-semibold text-gray-900 w-24 shrink-0">{d.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className="h-2.5 rounded-full transition-all duration-700"
                          style={{width:`${pct}%`, background:COLORS[i%COLORS.length]}} />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-8 text-right">{pct}%</span>
                      <span className="text-xs text-gray-400 w-6 text-right">{d.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Line chart */}
          {trends.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">📈 Activity Over Time</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trends.slice(0,30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{fontSize:10}} />
                  <YAxis tick={{fontSize:10}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ MODELS ════════════════════════════ */}
      {tab === 'models' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {modelMetrics.map((m,i) => (
              <div key={m.name} className="card hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-lg`}>
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-black bg-green-100 text-green-700 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Deployed
                  </span>
                </div>
                <h3 className="font-black text-gray-900 mb-0.5">{m.name}</h3>
                <p className="text-xs text-gray-400 font-medium mb-4">{m.model} · {m.type}</p>

                <div className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-500">Accuracy / Score</span>
                    <span className="text-xs font-black" style={{color:COLORS[i%COLORS.length]}}>{m.accuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full transition-all duration-1000"
                      style={{width:`${m.accuracy}%`, background:COLORS[i%COLORS.length]}} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> {m.scans} scans used
                  </span>
                  <span className="font-semibold text-blue-500 flex items-center gap-1">
                    View details <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Accuracy bar chart */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">📊 Model Accuracy Comparison</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={modelMetrics} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{fontSize:10}} />
                <YAxis domain={[0,100]} tick={{fontSize:10}} />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                <Bar dataKey="accuracy" radius={[8,8,0,0]}>
                  {modelMetrics.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Training summary */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">🗂️ Training Data Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {label:'Disease Images', value:'2,521', sub:'Real leaf photos',    gradient:'from-red-400 to-rose-500'},
                {label:'CSV Records',    value:'3,000', sub:'Farm data (India)',   gradient:'from-blue-400 to-indigo-500'},
                {label:'Total Models',   value:'26',    sub:'Trained & saved',     gradient:'from-green-400 to-emerald-500'},
                {label:'Best R²',        value:'0.90',  sub:'Yield (LightGBM)',    gradient:'from-purple-400 to-violet-500'},
              ].map(({label,value,sub,gradient}) => (
                <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg`}>
                  <p className="text-3xl font-black">{value}</p>
                  <p className="text-sm font-bold mt-1 text-white/90">{label}</p>
                  <p className="text-xs text-white/70 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
