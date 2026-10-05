import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchHistory } from '../store/scanSlice'
import { AppDispatch, RootState } from '../store'
import { Camera, TrendingUp, Leaf, Bug, CheckCircle, XCircle, Clock } from 'lucide-react'

const TYPE_ICONS: Record<string, any> = {
  disease: Camera, yield_prediction: TrendingUp,
  maturity: Leaf, pest: Bug, variety: Leaf
}
const TYPE_COLORS: Record<string, string> = {
  disease: 'bg-red-50 text-red-600', yield_prediction: 'bg-blue-50 text-blue-600',
  maturity: 'bg-green-50 text-green-600', pest: 'bg-yellow-50 text-yellow-600',
  variety: 'bg-purple-50 text-purple-600',
}

export default function History() {
  const dispatch = useDispatch<AppDispatch>()
  const { history, loading } = useSelector((s: RootState) => s.scan)

  useEffect(() => { dispatch(fetchHistory()) }, [dispatch])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
        <p className="text-gray-500 mt-1">{history.length} total scans</p>
      </div>

      {history.length === 0 ? (
        <div className="card text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No scans yet. Start by scanning your sugarcane.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((scan: any) => {
            const Icon = TYPE_ICONS[scan.scan_type] || Camera
            const color = TYPE_COLORS[scan.scan_type] || 'bg-gray-50 text-gray-600'
            const date = new Date(scan.created_at).toLocaleDateString('en-TZ', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })
            return (
              <div key={scan.id} className="card flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {scan.image_path && (
                  <img src={`/uploads/${scan.image_path}`} alt=""
                    className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{scan.prediction}</span>
                    {scan.confidence && (
                      <span className="text-xs text-gray-500">{(scan.confidence * 100).toFixed(0)}%</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 capitalize">{scan.scan_type.replace('_', ' ')} · {date}</p>
                </div>
                <div className="shrink-0">
                  {scan.is_correct === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {scan.is_correct === false && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
