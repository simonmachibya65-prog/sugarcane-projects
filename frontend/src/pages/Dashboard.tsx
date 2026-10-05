import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchStats } from '../store/scanSlice'
import { AppDispatch, RootState } from '../store'
import {
  Camera, TrendingUp, Leaf, Bug, BarChart2, ChevronRight, PlusCircle,
  Droplets, Sun, FlaskConical, Sprout, CloudRain, Activity,
} from 'lucide-react'

// ── All scan types grouped ────────────────────────────────────
const ML_SCANS = [
  {
    to: '/scan?type=disease',
    label: 'Disease Detection',
    icon: Camera,
    color: 'bg-red-50 text-red-600',
    desc: 'Photo of leaf',
  },
  {
    to: '/scan?type=yield',
    label: 'Yield Prediction',
    icon: TrendingUp,
    color: 'bg-blue-50 text-blue-600',
    desc: 'Estimate harvest output',
  },
  {
    to: '/scan?type=maturity',
    label: 'Maturity Check',
    icon: Leaf,
    color: 'bg-green-50 text-green-600',
    desc: 'Harvest readiness via Brix',
  },
  {
    to: '/scan?type=pest',
    label: 'Pest Detection',
    icon: Bug,
    color: 'bg-yellow-50 text-yellow-600',
    desc: 'Assess pest severity',
  },
  {
    to: '/scan?type=variety',
    label: 'Variety ID',
    icon: Sprout,
    color: 'bg-purple-50 text-purple-600',
    desc: 'Identify cane variety',
  },
]

const RULE_SCANS = [
  {
    to: '/scan?type=crop_health',
    label: 'Crop Health',
    icon: Activity,
    color: 'bg-lime-50 text-lime-700',
    desc: 'Vegetation health index',
  },
  {
    to: '/scan?type=water_stress',
    label: 'Water Stress',
    icon: Droplets,
    color: 'bg-cyan-50 text-cyan-600',
    desc: 'Irrigation adequacy check',
  },
  {
    to: '/scan?type=drought',
    label: 'Drought Assessment',
    icon: Sun,
    color: 'bg-amber-50 text-amber-600',
    desc: 'SPI-based drought scoring',
  },
  {
    to: '/scan?type=soil_condition',
    label: 'Soil Condition',
    icon: FlaskConical,
    color: 'bg-orange-50 text-orange-600',
    desc: 'pH & nutrient analysis',
  },
  {
    to: '/scan?type=growth_stage',
    label: 'Growth Stage',
    icon: Sprout,
    color: 'bg-emerald-50 text-emerald-600',
    desc: 'Stage-specific advice',
  },
  {
    to: '/scan?type=weather_impact',
    label: 'Weather Impact',
    icon: CloudRain,
    color: 'bg-sky-50 text-sky-600',
    desc: 'Temp & rainfall effects',
  },
  {
    to: '/scan?type=field_performance',
    label: 'Field Performance',
    icon: BarChart2,
    color: 'bg-indigo-50 text-indigo-600',
    desc: 'Compare across seasons',
  },
]

function ScanCard({ to, label, icon: Icon, color, desc }: typeof ML_SCANS[0]) {
  return (
    <Link to={to}
      className="card flex items-center gap-4 hover:shadow-md transition group cursor-pointer">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{label}</p>
        <p className="text-sm text-gray-500 truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition shrink-0" />
    </Link>
  )
}

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const { user }  = useSelector((s: RootState) => s.auth)
  const { stats } = useSelector((s: RootState) => s.scan)

  useEffect(() => { dispatch(fetchStats()) }, [dispatch])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {user?.full_name?.split(' ')[0] || 'Farmer'} 👋
        </h1>
        <p className="text-gray-500 mt-1">What would you like to check today?</p>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Scans',  value: stats.total_scans || 0,                  color: 'text-primary' },
            { label: 'Diseases',     value: stats.by_type?.disease || 0,              color: 'text-red-500' },
            { label: 'Yield Checks', value: stats.by_type?.yield_prediction || 0,     color: 'text-blue-500' },
            { label: 'Pest Checks',  value: stats.by_type?.pest || 0,                 color: 'text-yellow-500' },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ML-model scans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">AI Model Scans</h2>
        <p className="text-sm text-gray-500 mb-4">Powered by trained machine learning models</p>
        <div className="grid md:grid-cols-2 gap-4">
          {ML_SCANS.map(s => <ScanCard key={s.to} {...s} />)}
        </div>
      </div>

      {/* Rule-based scans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Analysis & Monitoring</h2>
        <p className="text-sm text-gray-500 mb-4">Rule-based assessments from your farm data</p>
        <div className="grid md:grid-cols-2 gap-4">
          {RULE_SCANS.map(s => <ScanCard key={s.to} {...s} />)}
        </div>
      </div>

      {/* Disease history breakdown */}
      {stats?.disease_breakdown && Object.keys(stats.disease_breakdown).length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" /> Disease History
            </h2>
            <Link to="/history" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {Object.entries(stats.disease_breakdown).map(([disease, count]: any) => (
              <div key={disease} className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0
                  ${disease === 'Healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {disease}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.min(100, (count / stats.total_scans) * 100)}%` }} />
                </div>
                <span className="text-sm text-gray-600 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats?.total_scans === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No scans yet</h3>
          <p className="text-gray-500 text-sm mb-6">
            Start by scanning your sugarcane for diseases, checking yield potential, or running a soil analysis.
          </p>
          <Link to="/scan" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Create First Scan
          </Link>
        </div>
      )}

    </div>
  )
}
