import { useState, useEffect, useRef } from 'react'
import { Home, MapPin, Leaf, Sun, Save, CheckCircle, Navigation, ZoomIn, ZoomOut, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

// Leaflet CSS injected dynamically
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

// Morogoro, Tanzania default center
const DEFAULT_LAT = -6.8242
const DEFAULT_LNG = 37.6542

export default function Farm() {
  const [saved, setSaved] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [mapTile, setMapTile] = useState<'street'|'satellite'>('street')
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [form, setForm] = useState({
    name: '', region: 'Morogoro', district: '', village: '',
    size_acres: '', variety: '', plant_age_months: '',
    soil_type: '', irrigation_type: '',
    latitude: String(DEFAULT_LAT), longitude: String(DEFAULT_LNG)
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // ── Load Leaflet dynamically ───────────────────────────────
  useEffect(() => {
    if (document.getElementById('leaflet-css')) { setMapReady(true); return }

    const css = document.createElement('link')
    css.id = 'leaflet-css'
    css.rel = 'stylesheet'
    css.href = LEAFLET_CSS
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.onload = () => setMapReady(true)
    document.head.appendChild(script)
  }, [])

  // ── Init map ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || leafletMap.current) return

    const L = (window as any).L
    if (!L) return

    const lat = parseFloat(form.latitude) || DEFAULT_LAT
    const lng = parseFloat(form.longitude) || DEFAULT_LNG

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: false,  // custom zoom controls
    })
    leafletMap.current = map

    // Tile layers
    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19
    })
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri — World Imagery', maxZoom: 19 }
    )

    streets.addTo(map)

    // Store layers for toggling
    ;(map as any)._tileLayers = { street: streets, satellite }

    // Custom marker
    const icon = L.divIcon({
      html: `<div style="
        width:36px;height:36px;background:linear-gradient(135deg,#16a34a,#059669);
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;">
        <div style="transform:rotate(45deg);font-size:16px;">🌿</div>
      </div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -40],
    })

    const marker = L.marker([lat, lng], { icon, draggable: true })
      .addTo(map)
      .bindPopup(`<b>📍 My Farm</b><br/>Lat: ${lat.toFixed(5)}<br/>Lng: ${lng.toFixed(5)}`, {
        className: 'custom-popup'
      })
      .openPopup()
    markerRef.current = marker

    // Update coords when marker dragged
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      set('latitude', pos.lat.toFixed(6))
      set('longitude', pos.lng.toFixed(6))
      marker.setPopupContent(`<b>📍 My Farm</b><br/>Lat: ${pos.lat.toFixed(5)}<br/>Lng: ${pos.lng.toFixed(5)}`)
    })

    // Click on map to move marker
    map.on('click', (e: any) => {
      marker.setLatLng(e.latlng)
      set('latitude', e.latlng.lat.toFixed(6))
      set('longitude', e.latlng.lng.toFixed(6))
      marker.setPopupContent(`<b>📍 My Farm</b><br/>Lat: ${e.latlng.lat.toFixed(5)}<br/>Lng: ${e.latlng.lng.toFixed(5)}`)
        .openPopup()
    })

    return () => {
      map.remove()
      leafletMap.current = null
    }
  }, [mapReady])

  // ── Toggle tile layer ──────────────────────────────────────
  const toggleTile = (type: 'street'|'satellite') => {
    const map = leafletMap.current
    const L = (window as any).L
    if (!map || !L) return
    const layers = (map as any)._tileLayers
    if (!layers) return
    Object.values(layers).forEach((l: any) => map.removeLayer(l))
    layers[type].addTo(map)
    setMapTile(type)
  }

  // ── Zoom controls ──────────────────────────────────────────
  const zoomIn  = () => leafletMap.current?.zoomIn()
  const zoomOut = () => leafletMap.current?.zoomOut()

  // ── GPS locate ────────────────────────────────────────────
  const handleLocate = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    toast.loading('Getting your location...')
    navigator.geolocation.getCurrentPosition(
      pos => {
        toast.dismiss()
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        set('latitude',  lat.toFixed(6))
        set('longitude', lng.toFixed(6))
        const map = leafletMap.current
        const marker = markerRef.current
        if (map && marker) {
          map.setView([lat, lng], 15)
          marker.setLatLng([lat, lng])
          marker.setPopupContent(`<b>📍 My Farm</b><br/>Lat: ${lat.toFixed(5)}<br/>Lng: ${lng.toFixed(5)}`).openPopup()
        }
        toast.success('Location captured!')
      },
      () => { toast.dismiss(); toast.error('Could not get location') }
    )
  }

  // ── Move map when coords typed ─────────────────────────────
  const handleCoordChange = (k: string, v: string) => {
    set(k, v)
    const map = leafletMap.current
    const marker = markerRef.current
    const lat = k === 'latitude'  ? parseFloat(v) : parseFloat(form.latitude)
    const lng = k === 'longitude' ? parseFloat(v) : parseFloat(form.longitude)
    if (map && marker && !isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], map.getZoom())
      marker.setLatLng([lat, lng])
      marker.setPopupContent(`<b>📍 My Farm</b><br/>Lat: ${lat.toFixed(5)}<br/>Lng: ${lng.toFixed(5)}`).openPopup()
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    toast.success('Farm profile saved!')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Home className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Farm Profile</h1>
          <p className="text-gray-500">Save your farm details and pin your location on the map</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── INTERACTIVE MAP ──────────────────────────────── */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Farm Location</h2>
                <p className="text-xs text-gray-400">Click on map or drag the 🌿 marker to set your location</p>
              </div>
            </div>
            <button type="button" onClick={handleLocate}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition">
              <Navigation className="w-4 h-4" /> Use My Location
            </button>
          </div>

          {/* Map container */}
          <div className="relative">
            <div ref={mapRef} className="w-full" style={{ height: '420px' }} />

            {/* Custom zoom controls */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
              <button type="button" onClick={zoomIn}
                className="w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition border border-gray-200">
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </button>
              <button type="button" onClick={zoomOut}
                className="w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition border border-gray-200">
                <ZoomOut className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {/* Tile switcher */}
            <div className="absolute top-3 left-3 z-[1000] flex gap-1.5">
              {([['street','🗺️ Map'],['satellite','🛰️ Satellite']] as const).map(([type, label]) => (
                <button key={type} type="button" onClick={() => toggleTile(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg transition border
                    ${mapTile === type
                      ? 'bg-green-500 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                  {label}
                </button>
              ))}
            </div>

            {!mapReady && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Coordinate inputs */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Latitude</label>
              <input type="number" step="any" className="input text-sm font-mono bg-white"
                placeholder="-6.8242"
                value={form.latitude}
                onChange={e => handleCoordChange('latitude', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Longitude</label>
              <input type="number" step="any" className="input text-sm font-mono bg-white"
                placeholder="37.6542"
                value={form.longitude}
                onChange={e => handleCoordChange('longitude', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
              <Leaf className="w-4 h-4 text-green-600" />
            </div>
            <h2 className="font-bold text-gray-900">Basic Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Farm Name</label>
              <input type="text" className="input" placeholder="e.g. Kilosa North Farm"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            {[
              { k:'district',    label:'District',          placeholder:'e.g. Kilosa' },
              { k:'village',     label:'Village',           placeholder:'e.g. Msongozi' },
              { k:'size_acres',  label:'Farm Size (acres)', placeholder:'e.g. 5.5', type:'number' },
            ].map(({ k, label, placeholder, type }) => (
              <div key={k}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input type={type || 'text'} className="input" placeholder={placeholder}
                  value={(form as any)[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        {/* Crop Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Sun className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="font-bold text-gray-900">Current Crop Details</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sugarcane Variety</label>
              <select className="input" value={form.variety} onChange={e => set('variety', e.target.value)}>
                <option value="">Select variety</option>
                {['CoJ64','Co98014','Co0238'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Plant Age (months)</label>
              <input type="number" className="input" placeholder="e.g. 10"
                value={form.plant_age_months} onChange={e => set('plant_age_months', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Soil Type</label>
              <select className="input" value={form.soil_type} onChange={e => set('soil_type', e.target.value)}>
                <option value="">Select soil type</option>
                {['Clay','Sandy','Loamy','Silt','Clay Loam'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Irrigation Type</label>
              <select className="input" value={form.irrigation_type} onChange={e => set('irrigation_type', e.target.value)}>
                <option value="">Select irrigation</option>
                {['Flood','Drip','Sprinkler','Furrow','None'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button type="submit"
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2
            ${saved ? 'bg-green-50 text-green-700 border-2 border-green-300' : 'btn-primary'}`}>
          {saved
            ? <><CheckCircle className="w-5 h-5" /> Farm Profile Saved!</>
            : <><Save className="w-5 h-5" /> Save Farm Profile</>}
        </button>
      </form>

      {/* Custom popup style */}
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          border: none;
          font-family: inherit;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  )
}
