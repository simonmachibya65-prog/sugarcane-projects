import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Leaf, Camera, TrendingUp, Droplets, Bug, Sprout,
  ChevronRight, ChevronLeft, Menu, X, ArrowRight,
  CheckCircle, Star, Users, Database, Zap, Shield,
  MapPin, Award
} from 'lucide-react'

const PROJECTS = [
  {
    id: 1, icon: Camera, emoji: '🔬', title: 'Disease Detection',
    subtitle: 'AI-Powered Leaf Analysis',
    description: 'Take a photo of your sugarcane leaf. Our EfficientNetB0 deep learning model detects 5 disease types with up to 95% accuracy and gives you an instant treatment plan.',
    features: ['Healthy', 'Mosaic', 'Red Rot', 'Rust', 'Yellow'],
    featureLabel: 'Detects:',
    accuracy: '95%',
    gradient: 'from-rose-500 via-red-500 to-orange-500',
    lightBg: 'bg-red-50', lightText: 'text-red-600', lightBorder: 'border-red-200',
    link: '/scan?type=disease', badge: '⭐ Most Popular', num: '01',
  },
  {
    id: 2, icon: TrendingUp, emoji: '📈', title: 'Yield Prediction',
    subtitle: 'Harvest Forecasting Engine',
    description: 'Enter your farm conditions — soil type, fertilizer, climate, irrigation — and get an accurate yield forecast in quintal/acre before your harvest season begins.',
    features: ['R² = 0.90', 'LightGBM', '6 models', 'Confidence range'],
    featureLabel: 'Performance:',
    accuracy: '90%',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    lightBg: 'bg-blue-50', lightText: 'text-blue-600', lightBorder: 'border-blue-200',
    link: '/scan?type=yield', badge: '🎯 High Accuracy', num: '02',
  },
  {
    id: 3, icon: Droplets, emoji: '🌡️', title: 'Maturity Prediction',
    subtitle: 'Optimal Harvest Timing',
    description: 'Know the exact day to harvest. Our model predicts the Brix value — sugar content — so you cut at peak quality and maximize your selling price at the sugar mill.',
    features: ['Brix prediction', 'Harvest date', 'Readiness score', 'Quality grade'],
    featureLabel: 'Features:',
    accuracy: 'Brix',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    lightBg: 'bg-green-50', lightText: 'text-green-600', lightBorder: 'border-green-200',
    link: '/scan?type=maturity', badge: '💰 Saves Money', num: '03',
  },
  {
    id: 4, icon: Bug, emoji: '🐛', title: 'Pest Detection',
    subtitle: 'Early Warning System',
    description: 'Identify pest infestation severity — Low, Medium, or High — before it damages your crop. Get specific pesticide recommendations and application timing guidance.',
    features: ['Low risk', 'Medium risk', 'High risk', 'Treatment plan'],
    featureLabel: 'Severity levels:',
    accuracy: '57%',
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    lightBg: 'bg-yellow-50', lightText: 'text-yellow-600', lightBorder: 'border-yellow-200',
    link: '/scan?type=pest', badge: '⚠️ Early Alert', num: '04',
  },
  {
    id: 5, icon: Sprout, emoji: '🌾', title: 'Variety Classification',
    subtitle: 'Sugarcane Identification',
    description: 'Identify your sugarcane variety from farm measurements. Understand the characteristics of CoJ64, Co98014, and Co0238 to optimize your cultivation practices.',
    features: ['CoJ64', 'Co98014', 'Co0238', 'XGBoost model'],
    featureLabel: 'Varieties:',
    accuracy: '35%',
    gradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
    lightBg: 'bg-purple-50', lightText: 'text-purple-600', lightBorder: 'border-purple-200',
    link: '/scan?type=variety', badge: '🔬 Scientific', num: '05',
  },
]

const STATS = [
  { icon: Database, value: '2,521', label: 'Real Training Images', color: 'from-blue-400 to-blue-600' },
  { icon: Zap,      value: '26',    label: 'Trained Models',        color: 'from-yellow-400 to-orange-500' },
  { icon: Shield,   value: '95%',   label: 'Disease Accuracy',      color: 'from-green-400 to-emerald-600' },
  { icon: MapPin,   value: 'TZ',    label: 'Morogoro, Tanzania',    color: 'from-red-400 to-rose-600' },
]

export default function Home() {
  const [menuOpen, setMenuOpen]     = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [prevSlide, setPrevSlide]   = useState(0)
  const [direction, setDirection]   = useState<'next'|'prev'>('next')
  const [isAnimating, setIsAnimating] = useState(false)
  const [scrollY, setScrollY]       = useState(0)
  const intervalRef = useRef<any>(null)

  // Parallax on scroll
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Autoplay
  const goTo = useCallback((idx: number, dir: 'next'|'prev' = 'next') => {
    if (isAnimating) return
    setIsAnimating(true)
    setPrevSlide(activeSlide)
    setDirection(dir)
    setActiveSlide(idx)
    setTimeout(() => setIsAnimating(false), 500)
  }, [activeSlide, isAnimating])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      goTo((activeSlide + 1) % PROJECTS.length, 'next')
    }, 4000)
    return () => clearInterval(intervalRef.current)
  }, [activeSlide, goTo])

  const next = () => { clearInterval(intervalRef.current); goTo((activeSlide+1)%PROJECTS.length,'next') }
  const prev = () => { clearInterval(intervalRef.current); goTo((activeSlide-1+PROJECTS.length)%PROJECTS.length,'prev') }

  const p = PROJECTS[activeSlide]
  const PIcon = p.icon

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrollY > 50 ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-lg leading-none">SugarCane AI</p>
              <p className="text-xs text-gray-500 font-medium">Morogoro, Tanzania</p>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {[['#projects','🌿 Projects'],['#features','✨ Features'],['#how','📖 How It Works']].map(([href,label])=>(
              <a key={href} href={href}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all">
                {label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-green-600 transition">
              Sign In
            </Link>
            <Link to="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all">
              Get Started Free →
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition"
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl px-4 py-5 space-y-2 animate-slide-up">
            {[['#projects','Projects'],['#features','Features'],['#how','How It Works']].map(([href,label])=>(
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-gray-700 font-medium rounded-xl hover:bg-gray-50">{label}</a>
            ))}
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Link to="/login" onClick={()=>setMenuOpen(false)}
                className="flex-1 text-center py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold">Sign In</Link>
              <Link to="/register" onClick={()=>setMenuOpen(false)}
                className="flex-1 text-center py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden
        bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 pt-20">
        {/* Floating background blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-3xl" />

        {/* Floating emoji decorations */}
        <div className="absolute top-32 right-20 text-5xl animate-float opacity-60 hidden lg:block" style={{animationDelay:'0.5s'}}>🌿</div>
        <div className="absolute top-48 left-16 text-4xl animate-float opacity-40 hidden lg:block" style={{animationDelay:'1s'}}>🌱</div>
        <div className="absolute bottom-32 left-24 text-5xl animate-float-slow opacity-50 hidden lg:block" style={{animationDelay:'1.5s'}}>🌾</div>
        <div className="absolute bottom-40 right-32 text-3xl animate-float opacity-50 hidden lg:block" style={{animationDelay:'2s'}}>🇹🇿</div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 px-5 py-2 rounded-full text-sm font-semibold mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI-Powered Agriculture for Tanzanian Farmers
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight animate-slide-up">
            Protect Your<br />
            <span className="gradient-text">Sugarcane Harvest</span><br />
            with AI
          </h1>

          <p className="text-xl text-green-200 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up delay-200">
            5 powerful AI tools in one platform. Detect diseases, predict yield,
            check maturity, identify pests — all built for <strong className="text-white">Morogoro, Tanzania</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-300">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all animate-pulse-glow">
              Start Free Today <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#projects"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm">
              View All 5 Tools <ChevronRight className="w-5 h-5" />
            </a>
          </div>

          {/* Mini stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-fade-in delay-500">
            {STATS.map(({icon:Icon, value, label, color}) => (
              <div key={label} className="flex items-center gap-2.5 text-white/80">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-black text-white text-lg leading-none">{value}</p>
                  <p className="text-xs text-green-300">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-green-300 animate-bounce">
          <p className="text-xs font-medium">Scroll to explore</p>
          <ChevronRight className="w-4 h-4 rotate-90" />
        </div>
      </section>

      {/* ── PROJECT SLIDER ─────────────────────────────────────── */}
      <section id="projects" className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              <Zap className="w-4 h-4" /> 5 AI Models Ready
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              One Platform,<br />
              <span className="gradient-text">Five Powerful Tools</span>
            </h2>
            <p className="text-gray-500 text-xl max-w-xl mx-auto">
              Everything a sugarcane farmer in Tanzania needs — in one app
            </p>
          </div>

          {/* ── MAIN SLIDER CARD ─────────────────────────────── */}
          <div className="relative mb-8">
            <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transition-all duration-500`}>
              <div className="grid lg:grid-cols-2 min-h-[480px]">

                {/* Left side */}
                <div className="p-8 lg:p-14 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full ${p.lightBg} ${p.lightText} border ${p.lightBorder}`}>
                      {p.badge}
                    </span>
                    <span className="text-xs text-gray-400 font-bold bg-gray-100 px-3 py-1.5 rounded-full">
                      {p.num} / 05
                    </span>
                  </div>

                  <div className={`flex items-center gap-4 mb-5 animate-slide-left`} key={`title-${activeSlide}`}>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-xl shrink-0`}>
                      <PIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-gray-900">{p.title}</h3>
                      <p className={`font-semibold ${p.lightText}`}>{p.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-lg leading-relaxed mb-7 animate-slide-up delay-100" key={`desc-${activeSlide}`}>
                    {p.description}
                  </p>

                  <div className="mb-8 animate-fade-in delay-200" key={`feats-${activeSlide}`}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{p.featureLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {p.features.map(f => (
                        <span key={f} className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl ${p.lightBg} ${p.lightText} border ${p.lightBorder}`}>
                          <CheckCircle className="w-3.5 h-3.5" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link to={p.link}
                    className={`inline-flex items-center gap-2 bg-gradient-to-r ${p.gradient} text-white px-7 py-3.5 rounded-2xl font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all w-fit`}>
                    Open {p.title} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Right side — visual */}
                <div className={`bg-gradient-to-br ${p.gradient} relative flex flex-col items-center justify-center p-12 overflow-hidden`}
                  key={`visual-${activeSlide}`}>
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full" />

                  {/* Big emoji */}
                  <div className="text-9xl mb-6 animate-float relative z-10 drop-shadow-2xl"
                    key={`emoji-${activeSlide}`}>
                    {p.emoji}
                  </div>

                  {/* Accuracy badge */}
                  <div className="relative z-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-8 py-4 text-center">
                    <p className="text-white/70 text-sm font-semibold mb-1">Model Performance</p>
                    <p className="text-white text-4xl font-black">{p.accuracy}</p>
                  </div>

                  {/* Number watermark */}
                  <div className="absolute bottom-6 right-8 text-white/10 text-[120px] font-black leading-none select-none">
                    {p.num}
                  </div>
                </div>
              </div>
            </div>

            {/* Arrows */}
            <button onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all border border-gray-200 z-10">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all border border-gray-200 z-10">
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* ── THUMBNAIL TABS ──────────────────────────────── */}
          <div className="grid grid-cols-5 gap-3">
            {PROJECTS.map((proj, i) => {
              const Icon = proj.icon
              const isActive = i === activeSlide
              return (
                <button key={proj.id} onClick={() => goTo(i, i > activeSlide ? 'next' : 'prev')}
                  className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 text-center overflow-hidden
                    ${isActive
                      ? `${proj.lightBorder} ${proj.lightBg} shadow-lg scale-105`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:-translate-y-1'}`}>
                  {/* Active indicator line */}
                  {isActive && (
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${proj.gradient} rounded-t-xl`} />
                  )}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${proj.gradient} flex items-center justify-center mx-auto mb-2
                    ${isActive ? 'shadow-lg scale-110' : 'group-hover:scale-110'} transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-xs font-bold hidden sm:block ${isActive ? proj.lightText : 'text-gray-600'}`}>
                    {proj.title.split(' ')[0]}
                  </p>
                  <p className={`text-[10px] hidden sm:block ${isActive ? proj.lightText + '/70' : 'text-gray-400'}`}>
                    {proj.num}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {PROJECTS.map((_, i) => (
              <button key={i} onClick={() => goTo(i, i > activeSlide ? 'next' : 'prev')}
                className={`transition-all duration-400 rounded-full
                  ${i === activeSlide
                    ? `w-10 h-3 bg-gradient-to-r ${PROJECTS[i].gradient}`
                    : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL CARDS GRID ─────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Explore All AI Tools</h2>
            <p className="text-gray-500 text-lg">Tap any card to start using that tool</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECTS.map((proj, i) => {
              const Icon = proj.icon
              return (
                <Link key={proj.id} to={proj.link}
                  className="group relative bg-white rounded-3xl border-2 border-gray-100 p-7 hover:border-transparent hover:shadow-2xl transition-all duration-400 hover:-translate-y-2 overflow-hidden cursor-pointer"
                  style={{animationDelay:`${i*80}ms`}}>
                  {/* Hover gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${proj.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-400`} />

                  {/* Top accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${proj.gradient} rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${proj.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${proj.lightBg} ${proj.lightText} border ${proj.lightBorder}`}>
                        {proj.badge}
                      </span>
                    </div>

                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{proj.emoji}</div>

                    <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-gray-700">{proj.title}</h3>
                    <p className={`text-sm font-semibold ${proj.lightText} mb-3`}>{proj.subtitle}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-5">{proj.description.slice(0,110)}...</p>

                    <div className={`inline-flex items-center gap-2 text-sm font-bold ${proj.lightText} group-hover:gap-3 transition-all`}>
                      Open Tool <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* CTA card */}
            <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Join Today — It's Free</h3>
                <p className="text-green-100 text-sm leading-relaxed">Create your account and access all 5 AI tools instantly. No credit card needed.</p>
              </div>
              <Link to="/register"
                className="relative z-10 mt-6 inline-flex items-center gap-2 bg-white text-green-700 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-green-50 hover:scale-105 transition-all shadow-xl w-fit">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how" className="py-24 px-4 bg-gradient-to-br from-gray-900 to-green-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Three simple steps to protect your harvest</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step:'01', emoji:'📱', title:'Create Account', desc:'Register free with email or phone. Takes 30 seconds.', color:'from-green-400 to-emerald-500' },
              { step:'02', emoji:'📸', title:'Scan Your Crop',  desc:'Upload a photo or enter farm data for instant AI analysis.', color:'from-blue-400 to-indigo-500' },
              { step:'03', emoji:'✅', title:'Get Results',     desc:'Predictions, confidence scores, and actionable treatment plans.', color:'from-purple-400 to-violet-500' },
            ].map((s, i) => (
              <div key={i} className="relative group">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-all hover:-translate-y-2 duration-300">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-5 shadow-xl group-hover:scale-110 transition-transform`}>
                    <span className="text-3xl">{s.emoji}</span>
                  </div>
                  <div className={`inline-block text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r ${s.color} text-white mb-4`}>
                    STEP {s.step}
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">{s.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-green-500 to-transparent z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="text-6xl mb-6 animate-float">🌿</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5">
            Protect Your Harvest Today
          </h2>
          <p className="text-green-100 text-xl mb-10 leading-relaxed">
            Join farmers across Morogoro using AI to prevent crop losses and maximize yield.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-green-700 px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 hover:shadow-3xl transition-all">
              Start Free — No Credit Card <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-500 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-black text-white">SugarCane AI</p>
                <p className="text-xs text-gray-500">Morogoro, Tanzania 🇹🇿</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {[['#projects','Projects'],['#features','All Tools'],['#how','How It Works'],
                ['/login','Sign In'],['/register','Register']].map(([href,label])=>(
                href.startsWith('#')
                  ? <a key={href} href={href} className="hover:text-white transition">{label}</a>
                  : <Link key={href} to={href} className="hover:text-white transition">{label}</Link>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 SugarCane AI — Built with ❤️ for Tanzanian sugarcane farmers in Morogoro</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
