import { useState } from 'react'
import { Settings, User, Bell, Globe, Shield, Save, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

export default function SettingsPage() {
  const { user } = useSelector((s: RootState) => s.auth)
  const [language, setLanguage] = useState('en')
  const [notifications, setNotifications] = useState({ disease: true, yield: true, weekly: false })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    toast.success('Settings saved!')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center shadow-lg">
          <Settings className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Settings</h1>
          <p className="text-gray-500">Manage your account and preferences</p>
        </div>
      </div>

      {/* Profile */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-bold text-gray-900">Profile</h2>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {user?.full_name?.[0]?.toUpperCase() || 'F'}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{user?.full_name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{user?.role}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Region</label>
            <input type="text" className="input" defaultValue={user?.region || 'Morogoro'} readOnly />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">District</label>
            <input type="text" className="input" defaultValue={user?.district || ''} />
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
            <Globe className="w-4 h-4 text-purple-600" />
          </div>
          <h2 className="font-bold text-gray-900">Language</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[{code:'en',label:'English 🇬🇧'},{code:'sw',label:'Kiswahili 🇹🇿'}].map(l => (
            <button key={l.code} onClick={() => setLanguage(l.code)}
              className={`py-3 rounded-2xl font-semibold text-sm transition-all border-2
                ${language === l.code
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
              {l.label}
            </button>
          ))}
        </div>
        {language === 'sw' && (
          <p className="mt-3 text-sm text-yellow-700 bg-yellow-50 rounded-xl px-4 py-2.5 border border-yellow-200">
            🚧 Kiswahili translation coming soon!
          </p>
        )}
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-yellow-50 rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-yellow-600" />
          </div>
          <h2 className="font-bold text-gray-900">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            {k:'disease', label:'Disease Alerts', desc:'Get notified about disease outbreaks in your region'},
            {k:'yield',   label:'Yield Reports',  desc:'Weekly yield prediction summaries'},
            {k:'weekly',  label:'Weekly Digest',  desc:'Summary of your farm activity every Monday'},
          ].map(({ k, label, desc }) => (
            <div key={k} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <button onClick={() => setNotifications(n => ({...n, [k]: !(n as any)[k]}))}
                className={`w-12 h-6 rounded-full transition-all relative ${(notifications as any)[k] ? 'bg-green-500' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${(notifications as any)[k] ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-red-600" />
          </div>
          <h2 className="font-bold text-gray-900">Security</h2>
        </div>
        <button className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-red-200 hover:bg-red-50 transition-all text-sm font-semibold text-gray-700 hover:text-red-700">
          🔐 Change Password
        </button>
      </div>

      <button onClick={handleSave}
        className={`w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all
          ${saved ? 'bg-green-50 text-green-600 border-2 border-green-200' : 'btn-primary'}`}>
        {saved ? <><CheckCircle className="w-5 h-5" /> Saved!</> : <><Save className="w-5 h-5" /> Save Settings</>}
      </button>
    </div>
  )
}
