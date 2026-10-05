import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { predictAPI } from '../utils/api'
import toast from 'react-hot-toast'
import {
  Upload, Camera, CheckCircle, AlertCircle, Loader, RotateCcw,
  ThumbsUp, ThumbsDown, Droplets, Sun, Leaf, FlaskConical,
  Sprout, BarChart2, CloudRain,
} from 'lucide-react'
import { scanAPI } from '../utils/api'
import clsx from 'clsx'

// ── Color helpers ─────────────────────────────────────────────
const DISEASE_COLORS: Record<string, string> = {
  Healthy: 'bg-green-50 border-green-200 text-green-800',
  Mosaic:  'bg-yellow-50 border-yellow-200 text-yellow-800',
  RedRot:  'bg-red-50 border-red-200 text-red-800',
  Rust:    'bg-orange-50 border-orange-200 text-orange-800',
  Yellow:  'bg-yellow-50 border-yellow-200 text-yellow-800',
}

const STATUS_COLORS: Record<string, string> = {
  // generic good → bad palette used by rule-based results
  Excellent:             'bg-green-50 border-green-300 text-green-900',
  Good:                  'bg-lime-50 border-lime-300 text-lime-900',
  Moderate:              'bg-yellow-50 border-yellow-300 text-yellow-900',
  Poor:                  'bg-orange-50 border-orange-300 text-orange-900',
  Critical:              'bg-red-50 border-red-300 text-red-900',
  None:                  'bg-green-50 border-green-300 text-green-900',
  Mild:                  'bg-lime-50 border-lime-300 text-lime-900',
  Severe:                'bg-orange-50 border-orange-300 text-orange-900',
  Extreme:               'bg-red-50 border-red-300 text-red-900',
  'No Drought':          'bg-green-50 border-green-300 text-green-900',
  'Mild Drought':        'bg-lime-50 border-lime-300 text-lime-900',
  'Moderate Drought':    'bg-yellow-50 border-yellow-300 text-yellow-900',
  'Severe Drought':      'bg-orange-50 border-orange-300 text-orange-900',
  'Extreme Drought':     'bg-red-50 border-red-300 text-red-900',
  Favourable:            'bg-green-50 border-green-300 text-green-900',
  'Mildly Unfavourable': 'bg-yellow-50 border-yellow-300 text-yellow-900',
  'Moderately Unfavourable': 'bg-orange-50 border-orange-300 text-orange-900',
  'Severely Unfavourable':   'bg-red-50 border-red-300 text-red-900',
}

// ── Scan type metadata ────────────────────────────────────────
const TYPE_META: Record<string, { label: string; desc: string; imageOnly?: boolean }> = {
  disease:        { label: 'Disease Detection',   desc: 'Upload a photo of a sugarcane leaf to detect diseases', imageOnly: true },
  yield:          { label: 'Yield Prediction',    desc: 'Enter farm data to estimate your expected yield' },
  maturity:       { label: 'Maturity Check',      desc: 'Check if your sugarcane is ready for harvest' },
  pest:           { label: 'Pest Detection',      desc: 'Assess pest severity from farm conditions' },
  variety:        { label: 'Variety Identification', desc: 'Identify your sugarcane variety from farm data' },
  crop_health:    { label: 'Crop Health',         desc: 'Compute a vegetation health index from farm conditions' },
  water_stress:   { label: 'Water Stress',        desc: 'Detect water stress based on rainfall, humidity and irrigation' },
  drought:        { label: 'Drought Assessment',  desc: 'Evaluate drought conditions using a simplified SPI score' },
  soil_condition: { label: 'Soil Condition',      desc: 'Analyse soil quality from pH, nutrients and soil type' },
  growth_stage:   { label: 'Growth Stage',        desc: 'Determine crop growth stage and get stage-specific advice' },
  field_performance: { label: 'Field Performance', desc: 'Compare your field results across scans and seasons' },
  weather_impact: { label: 'Weather Impact',      desc: 'Assess how current weather is affecting your crop' },
}

// ── Input field definitions per scan type ────────────────────
// Fields shown for each scan type (subset of TabularInput)
const TYPE_FIELDS: Record<string, { numeric: { k: string; label: string }[]; selects: { k: string; label: string; options: string[] }[] }> = {
  yield: {
    numeric: [
      { k: 'cane_height_cm',        label: 'Cane Height (cm)' },
      { k: 'cane_diameter_cm',      label: 'Cane Diameter (cm)' },
      { k: 'crop_duration_days',    label: 'Crop Age (days)' },
      { k: 'nitrogen_kg_per_acre',  label: 'Nitrogen (kg/acre)' },
      { k: 'rainfall_total_mm',     label: 'Rainfall (mm)' },
      { k: 'temp_avg_c',            label: 'Avg Temp (°C)' },
    ],
    selects: [
      { k: 'soil_type',         label: 'Soil Type',     options: ['Clay','Sandy','Loamy','Silt','Black'] },
      { k: 'growth_stage',      label: 'Growth Stage',  options: ['Germination','Tillering','Grand Growth','Maturation'] },
      { k: 'season',            label: 'Season',         options: ['Kharif','Rabi'] },
      { k: 'irrigation_method', label: 'Irrigation',     options: ['Flood','Drip','Sprinkler','None'] },
    ],
  },
  maturity: {
    numeric: [
      { k: 'brix_value',            label: 'Brix Value (if known)' },
      { k: 'crop_duration_days',    label: 'Crop Age (days)' },
      { k: 'temp_avg_c',            label: 'Avg Temp (°C)' },
      { k: 'rainfall_total_mm',     label: 'Rainfall (mm)' },
    ],
    selects: [
      { k: 'variety',           label: 'Variety',        options: ['CoJ64','Co0238','Co98014'] },
      { k: 'irrigation_method', label: 'Irrigation',     options: ['Flood','Drip','Sprinkler','None'] },
    ],
  },
  pest: {
    numeric: [
      { k: 'crop_duration_days',    label: 'Crop Age (days)' },
      { k: 'temp_avg_c',            label: 'Avg Temp (°C)' },
      { k: 'humidity_pct',          label: 'Humidity (%)' },
      { k: 'rainfall_total_mm',     label: 'Rainfall (mm)' },
    ],
    selects: [
      { k: 'growth_stage',      label: 'Growth Stage',  options: ['Germination','Tillering','Grand Growth','Maturation'] },
      { k: 'season',            label: 'Season',         options: ['Kharif','Rabi'] },
    ],
  },
  variety: {
    numeric: [
      { k: 'cane_height_cm',        label: 'Cane Height (cm)' },
      { k: 'cane_diameter_cm',      label: 'Cane Diameter (cm)' },
      { k: 'brix_value',            label: 'Brix Value' },
      { k: 'tillering_count',       label: 'Tiller Count' },
    ],
    selects: [
      { k: 'soil_type',         label: 'Soil Type',     options: ['Clay','Sandy','Loamy','Silt','Black'] },
      { k: 'season',            label: 'Season',         options: ['Kharif','Rabi'] },
    ],
  },
  crop_health: {
    numeric: [
      { k: 'cane_height_cm',        label: 'Cane Height (cm)' },
      { k: 'rainfall_total_mm',     label: 'Rainfall (mm)' },
      { k: 'humidity_pct',          label: 'Humidity (%)' },
      { k: 'temp_avg_c',            label: 'Avg Temp (°C)' },
      { k: 'nitrogen_kg_per_acre',  label: 'Nitrogen (kg/acre)' },
    ],
    selects: [
      { k: 'growth_stage',      label: 'Growth Stage',  options: ['Germination','Tillering','Grand Growth','Maturation','Harvest Ready'] },
    ],
  },
  water_stress: {
    numeric: [
      { k: 'rainfall_total_mm',     label: 'Rainfall (mm)' },
      { k: 'humidity_pct',          label: 'Humidity (%)' },
      { k: 'temp_avg_c',            label: 'Avg Temp (°C)' },
      { k: 'crop_duration_days',    label: 'Crop Age (days)' },
    ],
    selects: [
      { k: 'irrigation_method', label: 'Irrigation',     options: ['Flood','Drip','Sprinkler','None'] },
    ],
  },
  drought: {
    numeric: [
      { k: 'rainfall_total_mm',     label: 'Rainfall (mm)' },
      { k: 'temp_avg_c',            label: 'Avg Temp (°C)' },
      { k: 'humidity_pct',          label: 'Humidity (%)' },
      { k: 'crop_duration_days',    label: 'Crop Age (days)' },
    ],
    selects: [
      { k: 'irrigation_method', label: 'Irrigation',     options: ['Flood','Drip','Sprinkler','None'] },
    ],
  },
  soil_condition: {
    numeric: [
      { k: 'soil_ph',               label: 'Soil pH' },
      { k: 'nitrogen_kg_per_acre',  label: 'Nitrogen (kg/acre)' },
      { k: 'phosphorus_kg_per_acre',label: 'Phosphorus (kg/acre)' },
      { k: 'potassium_kg_per_acre', label: 'Potassium (kg/acre)' },
    ],
    selects: [
      { k: 'soil_type',         label: 'Soil Type',     options: ['Clay','Sandy','Loamy','Silt','Black'] },
    ],
  },
  growth_stage: {
    numeric: [
      { k: 'crop_duration_days',    label: 'Crop Age (days)' },
      { k: 'cane_height_cm',        label: 'Cane Height (cm)' },
      { k: 'tillering_count',       label: 'Tiller Count' },
    ],
    selects: [
      { k: 'variety',           label: 'Variety (optional)', options: ['CoJ64','Co0238','Co98014'] },
      { k: 'growth_stage',      label: 'Current Stage (optional)', options: ['Germination','Tillering','Grand Growth','Maturation','Harvest Ready'] },
    ],
  },
  weather_impact: {
    numeric: [
      { k: 'temp_avg_c',            label: 'Avg Temp (°C)' },
      { k: 'rainfall_total_mm',     label: 'Rainfall (mm)' },
      { k: 'humidity_pct',          label: 'Humidity (%)' },
      { k: 'crop_duration_days',    label: 'Crop Age (days)' },
    ],
    selects: [
      { k: 'growth_stage',      label: 'Growth Stage',  options: ['Germination','Tillering','Grand Growth','Maturation'] },
      { k: 'season',            label: 'Season',         options: ['Kharif','Rabi'] },
    ],
  },
}

// field_performance has no tabular inputs — fetches from history
const FIELD_PERF_PERIODS = [
  { label: 'Last 30 days',  value: 30 },
  { label: 'Last 90 days',  value: 90 },
  { label: 'Last 180 days', value: 180 },
  { label: 'Last year',     value: 365 },
]

// ── Score bar helper ──────────────────────────────────────────
function ScoreBar({ value, max = 100, color = 'bg-primary' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 mt-1">
      <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}

// ── Recommendations list ──────────────────────────────────────
function RecsList({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
      <ul className="space-y-2">
        {items.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Stat pill ─────────────────────────────────────────────────
function StatPill({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function Scan() {
  const [params] = useSearchParams()
  const type = params.get('type') || 'disease'

  const [file, setFile]         = useState<File | null>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<any>(null)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [tabData, setTabData]   = useState<Record<string, any>>({})
  const [perfPeriod, setPerfPeriod] = useState(90)

  const setTab = (k: string, v: any) => setTabData(d => ({ ...d, [k]: v }))

  const onDrop = useCallback((files: File[]) => {
    const f = files[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setFeedback(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, disabled: type !== 'disease',
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      let res: any
      switch (type) {
        case 'disease':        if (!file) { toast.error('Please upload an image'); return }
                               res = await predictAPI.disease(file); break
        case 'yield':          res = await predictAPI.yield(tabData); break
        case 'maturity':       res = await predictAPI.maturity(tabData); break
        case 'pest':           res = await predictAPI.pest(tabData); break
        case 'variety':        res = await predictAPI.variety(tabData); break
        case 'crop_health':    res = await predictAPI.cropHealth(tabData); break
        case 'water_stress':   res = await predictAPI.waterStress(tabData); break
        case 'drought':        res = await predictAPI.drought(tabData); break
        case 'soil_condition': res = await predictAPI.soilCondition(tabData); break
        case 'growth_stage':   res = await predictAPI.growthStage(tabData); break
        case 'weather_impact': res = await predictAPI.weatherImpact(tabData); break
        case 'field_performance': {
          res = await scanAPI.fieldPerformance({ period_days: perfPeriod })
          break
        }
        default: toast.error('Unknown scan type'); return
      }
      setResult(res?.data)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (correct: boolean) => {
    if (!result?.scan_id) return
    try {
      await predictAPI.feedback({ scan_id: result.scan_id, is_correct: correct })
      setFeedback(correct)
      toast.success(correct ? 'Thanks for confirming!' : 'Thanks for the correction!')
    } catch { toast.error('Could not save feedback') }
  }

  const reset = () => { setFile(null); setPreview(null); setResult(null); setFeedback(null); setTabData({}) }

  const meta = TYPE_META[type] || { label: 'Scan', desc: 'Enter farm data' }
  const fields = TYPE_FIELDS[type]
  const isImageType = type === 'disease'
  const isFieldPerf = type === 'field_performance'

  // Generic status colour lookup
  const statusColor = (s: string) => STATUS_COLORS[s] || 'bg-gray-50 border-gray-200 text-gray-900'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{meta.label}</h1>
        <p className="text-gray-500 mt-1">{meta.desc}</p>
      </div>

      {/* ── Image upload (disease only) ── */}
      {isImageType && !result && (
        <div {...getRootProps()} className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition',
          isDragActive ? 'border-primary bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50',
        )}>
          <input {...getInputProps()} />
          {preview
            ? <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            : (
              <div>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-700">Drop leaf photo here or click to upload</p>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG, WebP up to 10MB</p>
              </div>
            )}
        </div>
      )}

      {/* ── Field performance period picker ── */}
      {isFieldPerf && !result && (
        <div className="card space-y-3">
          <p className="font-medium text-gray-700">Select analysis period</p>
          <div className="grid grid-cols-2 gap-3">
            {FIELD_PERF_PERIODS.map(p => (
              <button key={p.value}
                onClick={() => setPerfPeriod(p.value)}
                className={clsx(
                  'rounded-xl border-2 py-3 text-sm font-medium transition',
                  perfPeriod === p.value
                    ? 'border-primary bg-green-50 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-primary',
                )}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabular inputs ── */}
      {!isImageType && !isFieldPerf && !result && fields && (
        <div className="card space-y-4">
          {fields.numeric.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {fields.numeric.map(({ k, label }) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="number" className="input" placeholder="0"
                    onChange={e => setTab(k, parseFloat(e.target.value) || 0)} />
                </div>
              ))}
            </div>
          )}
          {fields.selects.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {fields.selects.map(({ k, label, options }) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <select className="input" onChange={e => setTab(k, e.target.value)}>
                    <option value="">Select</option>
                    {options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Submit button ── */}
      {!result && (
        <button onClick={handleSubmit}
          disabled={loading || (isImageType && !file)}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          {loading
            ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</>
            : <><Camera className="w-4 h-4" /> {isFieldPerf ? 'Analyse Performance' : 'Get Prediction'}</>}
        </button>
      )}

      {/* ══════════════════════════════════════════════════════
          RESULTS
         ══════════════════════════════════════════════════════ */}
      {result && (
        <div className="space-y-4">

          {/* ── Disease ── */}
          {type === 'disease' && (
            <div className={clsx('card border-2', DISEASE_COLORS[result.prediction] || 'bg-gray-50 border-gray-200')}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {result.prediction === 'Healthy'
                      ? <CheckCircle className="w-5 h-5 text-green-600" />
                      : <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span className="text-xl font-bold">{result.prediction}</span>
                  </div>
                  <p className="text-sm opacity-75">Severity: {result.severity}</p>
                  <p className="text-sm opacity-75">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                </div>
                {preview && <img src={preview} alt="" className="w-16 h-16 rounded-lg object-cover" />}
              </div>
              {result.all_predictions && (
                <div className="mt-4 space-y-1.5">
                  {Object.entries(result.all_predictions as Record<string, number>)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cls, prob]) => (
                      <div key={cls} className="flex items-center gap-2 text-xs">
                        <span className="w-16 shrink-0">{cls}</span>
                        <div className="flex-1 bg-white/60 rounded-full h-1.5">
                          <div className="bg-current h-1.5 rounded-full opacity-70"
                            style={{ width: `${(prob * 100).toFixed(0)}%` }} />
                        </div>
                        <span className="w-10 text-right">{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ── Yield ── */}
          {type === 'yield' && (
            <div className="card bg-blue-50 border-2 border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-1">Predicted Yield</p>
              <p className="text-4xl font-bold text-blue-900">{result.predicted_yield}</p>
              <p className="text-blue-700 text-sm">quintal/acre</p>
              <p className="text-xs text-blue-600 mt-2">
                Range: {result.confidence_interval?.low} – {result.confidence_interval?.high} quintal/acre
              </p>
              <p className="text-xs text-blue-400 mt-1">Model: {result.model_used}</p>
            </div>
          )}

          {/* ── Maturity ── */}
          {type === 'maturity' && (
            <div className={clsx('card border-2',
              result.status === 'Harvest Ready' ? 'bg-green-50 border-green-200' :
              result.status === 'Near Ready'    ? 'bg-yellow-50 border-yellow-200' :
                                                  'bg-red-50 border-red-200')}>
              <p className="text-2xl font-bold">{result.status}</p>
              <p className="text-3xl font-bold mt-1">Brix: {result.brix_value}</p>
              {result.days_to_harvest > 0 &&
                <p className="text-sm mt-1 opacity-75">~{result.days_to_harvest} days to harvest</p>}
            </div>
          )}

          {/* ── Pest ── */}
          {type === 'pest' && (
            <div className={clsx('card border-2',
              result.pest_level === 'Low'    ? 'bg-green-50 border-green-200' :
              result.pest_level === 'Medium' ? 'bg-yellow-50 border-yellow-200' :
                                              'bg-red-50 border-red-200')}>
              <p className="text-sm font-medium opacity-75">Pest Level</p>
              <p className="text-3xl font-bold">{result.pest_level}</p>
              <p className="text-sm opacity-75">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
            </div>
          )}

          {/* ── Variety ── */}
          {type === 'variety' && (
            <div className="card bg-purple-50 border-2 border-purple-200">
              <p className="text-sm text-purple-600 font-medium mb-1">Predicted Variety</p>
              <p className="text-3xl font-bold text-purple-900">{result.predicted_variety}</p>
              <p className="text-purple-600 text-sm mt-1">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
              {result.all_varieties && (
                <div className="mt-3 space-y-1.5">
                  {Object.entries(result.all_varieties as Record<string, number>)
                    .sort(([, a], [, b]) => b - a)
                    .map(([v, p]) => (
                      <div key={v} className="flex items-center gap-2 text-xs text-purple-800">
                        <span className="w-16 shrink-0">{v}</span>
                        <div className="flex-1 bg-purple-100 rounded-full h-1.5">
                          <div className="bg-purple-400 h-1.5 rounded-full"
                            style={{ width: `${(p * 100).toFixed(0)}%` }} />
                        </div>
                        <span className="w-10 text-right">{(p * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ── Crop Health ── */}
          {type === 'crop_health' && (
            <div className={clsx('card border-2', statusColor(result.status))}>
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-5 h-5" />
                <span className="text-xl font-bold">{result.status}</span>
              </div>
              <p className="text-sm opacity-80 mb-3">{result.summary}</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <StatPill label="VHI Score" value={result.vhi_score} sub="/ 100" />
                <StatPill label="Vegetation" value={result.vci} sub="VCI" />
                <StatPill label="Temperature" value={result.tci} sub="TCI" />
              </div>
              <ScoreBar value={result.vhi_score}
                color={result.vhi_score >= 75 ? 'bg-green-500' : result.vhi_score >= 55 ? 'bg-lime-400' : result.vhi_score >= 35 ? 'bg-yellow-400' : 'bg-red-500'} />
            </div>
          )}

          {/* ── Water Stress ── */}
          {type === 'water_stress' && (
            <div className={clsx('card border-2', statusColor(result.stress_level))}>
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-5 h-5" />
                <span className="text-xl font-bold">{result.status}</span>
              </div>
              <p className="text-sm opacity-80 mb-3">{result.summary}</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <StatPill label="Stress Score"   value={`${result.stress_score}%`} />
                <StatPill label="Supply"         value={`${result.effective_water_mm} mm`} sub="effective" />
                <StatPill label="Demand"         value={`${result.estimated_demand_mm} mm`} sub="estimated" />
              </div>
              <ScoreBar value={result.stress_score}
                color={result.stress_score < 20 ? 'bg-green-500' : result.stress_score < 40 ? 'bg-yellow-400' : result.stress_score < 65 ? 'bg-orange-400' : 'bg-red-500'} />
            </div>
          )}

          {/* ── Drought ── */}
          {type === 'drought' && (
            <div className={clsx('card border-2', statusColor(result.drought_category))}>
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-5 h-5" />
                <span className="text-xl font-bold">{result.drought_category}</span>
              </div>
              <p className="text-sm opacity-80 mb-3">{result.summary}</p>
              <div className="grid grid-cols-2 gap-3">
                <StatPill label="SPI Score"      value={result.spi_score} />
                <StatPill label="Monthly Rainfall" value={`${result.monthly_rainfall_mm} mm`} />
              </div>
            </div>
          )}

          {/* ── Soil Condition ── */}
          {type === 'soil_condition' && (
            <div className={clsx('card border-2', statusColor(result.overall_condition))}>
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-5 h-5" />
                <span className="text-xl font-bold">Soil: {result.overall_condition}</span>
              </div>
              <ScoreBar value={result.soil_score}
                color={result.soil_score >= 75 ? 'bg-green-500' : result.soil_score >= 50 ? 'bg-yellow-400' : 'bg-red-500'} />
              <p className="text-xs text-right mt-1 opacity-60">{result.soil_score}/100</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <StatPill label="pH"         value={result.ph_status} />
                <StatPill label="Nitrogen"   value={result.nitrogen_status} />
                <StatPill label="Phosphorus" value={result.phosphorus_status} />
                <StatPill label="Potassium"  value={result.potassium_status} />
              </div>
              {result.issues?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Issues detected:</p>
                  <ul className="space-y-1">
                    {result.issues.map((issue: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs opacity-80">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── Growth Stage ── */}
          {type === 'growth_stage' && (
            <div className="card bg-emerald-50 border-2 border-emerald-200 text-emerald-900">
              <div className="flex items-center gap-2 mb-1">
                <Sprout className="w-5 h-5" />
                <span className="text-xl font-bold">{result.stage}</span>
                <span className="ml-auto text-xs bg-emerald-200 px-2 py-0.5 rounded-full">
                  Stage {result.stage_number}/5
                </span>
              </div>
              <p className="text-sm opacity-80 mb-3">{result.description}</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <StatPill label="Crop Age"    value={`${result.crop_age_days} days`} />
                <StatPill label="Expected"    value={result.expected_duration_range} />
              </div>
              {/* Stage progress bar */}
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className={clsx(
                    'flex-1 h-2 rounded-full',
                    n <= result.stage_number ? 'bg-emerald-500' : 'bg-emerald-100',
                  )} />
                ))}
              </div>
              {result.height_assessment && (
                <p className="text-xs mt-2 opacity-70">{result.height_assessment}</p>
              )}
            </div>
          )}

          {/* ── Weather Impact ── */}
          {type === 'weather_impact' && (
            <div className={clsx('card border-2', statusColor(result.weather_rating))}>
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="w-5 h-5" />
                <span className="text-xl font-bold">{result.weather_rating}</span>
              </div>
              <p className="text-sm opacity-80 mb-3">{result.summary}</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <StatPill label="Impact Score"    value={`${result.impact_score}%`} />
                <StatPill label="Temp"            value={`${result.temp_avg_c}°C`} />
                <StatPill label="Monthly Rain"    value={`${result.monthly_rainfall_mm} mm`} />
              </div>
              <ScoreBar value={result.impact_score}
                color={result.impact_score < 20 ? 'bg-green-500' : result.impact_score < 40 ? 'bg-yellow-400' : result.impact_score < 65 ? 'bg-orange-400' : 'bg-red-500'} />
              {result.impacts?.length > 0 && (
                <div className="mt-4 space-y-1">
                  {result.impacts.map((imp: string, i: number) => (
                    <p key={i} className="text-xs opacity-75">• {imp}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Field Performance ── */}
          {type === 'field_performance' && (
            <div className="space-y-4">
              <div className="card bg-indigo-50 border-2 border-indigo-200 text-indigo-900">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-5 h-5" />
                  <span className="text-lg font-bold">Field Performance — last {result.period_days} days</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatPill label="Total Scans"   value={result.total_scans} />
                  <StatPill label="Avg Yield"     value={result.avg_yield ? `${result.avg_yield} q/ac` : '—'} />
                  <StatPill label="Avg Confidence" value={result.avg_confidence ? `${(result.avg_confidence * 100).toFixed(0)}%` : '—'} />
                  <StatPill label="Top Result"    value={result.best_prediction || '—'} />
                </div>
              </div>

              {/* Scan type breakdown */}
              {Object.keys(result.scan_breakdown || {}).length > 0 && (
                <div className="card">
                  <p className="font-semibold text-gray-900 mb-3">Scans by type</p>
                  <div className="space-y-2">
                    {Object.entries(result.scan_breakdown as Record<string, number>)
                      .sort(([, a], [, b]) => b - a)
                      .map(([t, count]) => (
                        <div key={t} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-32 shrink-0 capitalize">{t.replace(/_/g, ' ')}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.min(100, (count / result.total_scans) * 100)}%` }} />
                          </div>
                          <span className="text-sm font-medium w-6 text-right">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Disease breakdown */}
              {Object.keys(result.disease_breakdown || {}).length > 0 && (
                <div className="card">
                  <p className="font-semibold text-gray-900 mb-3">Disease breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(result.disease_breakdown as Record<string, number>)
                      .sort(([, a], [, b]) => b - a)
                      .map(([d, count]) => (
                        <div key={d} className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0
                            ${d === 'Healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {d}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.min(100, (count / result.total_scans) * 100)}%` }} />
                          </div>
                          <span className="text-sm font-medium w-6 text-right">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Shared recommendations block ── */}
          {type !== 'field_performance' && (
            <RecsList items={result.recommendations || (result.recommendation ? [result.recommendation] : [])} />
          )}
          {type === 'field_performance' && result.recommendations?.length > 0 && (
            <RecsList items={result.recommendations} />
          )}

          {/* ── Feedback (not for field_performance — no scan_id) ── */}
          {type !== 'field_performance' && result.scan_id && feedback === null && (
            <div className="card">
              <p className="text-sm font-medium text-gray-700 mb-3">Was this result accurate?</p>
              <div className="flex gap-3">
                <button onClick={() => handleFeedback(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm font-medium">
                  <ThumbsUp className="w-4 h-4" /> Yes, correct
                </button>
                <button onClick={() => handleFeedback(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium">
                  <ThumbsDown className="w-4 h-4" /> No, wrong
                </button>
              </div>
            </div>
          )}
          {feedback !== null && (
            <p className="text-sm text-gray-500 text-center">
              {feedback ? '✓ Feedback saved — thank you!' : '✓ Thanks for the correction — helps improve the model!'}
            </p>
          )}

          <button onClick={reset} className="btn-secondary w-full flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" /> New Scan
          </button>
        </div>
      )}
    </div>
  )
}
