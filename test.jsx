import { useState } from 'react'
import { 
  Sparkles, Bell, Home, Users, TrendingUp, Check, X, Star, 
  Heart, Zap, Send, RefreshCw, ChevronRight, Plus, Trash2,
  Building2, Mail, Eye
} from 'lucide-react'

function AnimationsDemo() {
  const [showConfetti, setShowConfetti] = useState(false)
  const [counter, setCounter] = useState(0)
  const [showNotif, setShowNotif] = useState(false)
  const [liked, setLiked] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [buttonPressed, setButtonPressed] = useState(null)

  // Animation compteur
  const animateCounter = (target) => {
    setCounter(0)
    let current = 0
    const increment = target / 30
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCounter(target)
        clearInterval(timer)
      } else {
        setCounter(Math.round(current))
      }
    }, 30)
  }

  // Confetti simple
  const triggerConfetti = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">🎨 Animations Demo</h1>
      <p className="text-gray-500 mb-8">Clique sur les éléments pour voir les animations</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* ============================================ */}
        {/* 1. BOUTONS */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1E3A5F] mb-4">1. Boutons Interactifs</h2>
          
          {/* Bounce on click */}
          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase">Bounce Click</p>
            <button 
              className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg font-medium
                         transition-transform active:scale-95 hover:scale-105 hover:shadow-lg"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={16} />
                Bounce Effect
              </span>
            </button>
          </div>

          {/* Ripple effect */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-400 uppercase">Press Effect</p>
            <button 
              onMouseDown={() => setButtonPressed('press')}
              onMouseUp={() => setButtonPressed(null)}
              onMouseLeave={() => setButtonPressed(null)}
              className={`px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium
                         transition-all duration-150 ${buttonPressed === 'press' ? 'scale-95 shadow-inner' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
            >
              Press Me
            </button>
          </div>

          {/* Glow effect */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-400 uppercase">Glow Hover</p>
            <button 
              className="px-4 py-2 bg-violet-500 text-white rounded-lg font-medium
                         transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
            >
              Glow Effect
            </button>
          </div>

          {/* Loading button */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-400 uppercase">Loading State</p>
            <button 
              className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium
                         flex items-center gap-2"
            >
              <RefreshCw size={16} className="animate-spin" />
              Processing...
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* 2. SCORES ANIMÉS */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1E3A5F] mb-4">2. Scores Animés</h2>
          
          {/* Counter animation */}
          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase">Counter Animation</p>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{counter}</span>
              </div>
              <button 
                onClick={() => animateCounter(85)}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
              >
                Animer → 85
              </button>
            </div>
          </div>

          {/* Pulse score */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-400 uppercase">Pulse Score</p>
            <div className="w-16 h-16 bg-emerald-500 rounded-xl flex items-center justify-center animate-pulse">
              <span className="text-xl font-bold text-white">92</span>
            </div>
          </div>

          {/* Ring progress */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-400 uppercase">Ring Progress</p>
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90">
                <circle cx="40" cy="40" r="35" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                <circle 
                  cx="40" cy="40" r="35" 
                  stroke="#10b981" 
                  strokeWidth="6" 
                  fill="none"
                  strokeDasharray="220"
                  strokeDashoffset="44"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#1E3A5F]">80%</span>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 3. CONFETTI & CÉLÉBRATION */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <h2 className="font-bold text-[#1E3A5F] mb-4">3. Confetti & Célébration</h2>
          
          {/* Confetti */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                    borderRadius: Math.random() > 0.5 ? '50%' : '0',
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                />
              ))}
            </div>
          )}
          
          <button 
            onClick={triggerConfetti}
            className="px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium
                       flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <Star size={18} />
            Déclencher Confetti 🎉
          </button>

          {/* Success checkmark */}
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-400 uppercase">Success Animation</p>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check size={32} className="text-emerald-500 animate-bounce-in" />
            </div>
          </div>

          {/* Like heart */}
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-400 uppercase">Like Animation</p>
            <button 
              onClick={() => setLiked(!liked)}
              className="p-3 rounded-full bg-gray-100 hover:bg-red-50 transition-colors"
            >
              <Heart 
                size={24} 
                className={`transition-all duration-300 ${liked ? 'text-red-500 fill-red-500 scale-125' : 'text-gray-400'}`}
              />
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* 4. NOTIFICATIONS */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm relative">
          <h2 className="font-bold text-[#1E3A5F] mb-4">4. Notifications</h2>
          
          <button 
            onClick={() => { setShowNotif(true); setTimeout(() => setShowNotif(false), 3000) }}
            className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg font-medium flex items-center gap-2"
          >
            <Bell size={16} />
            Afficher Notification
          </button>

          {/* Notification toast */}
          <div className={`fixed top-4 right-4 bg-white rounded-xl shadow-2xl p-4 flex items-center gap-3 transition-all duration-500 z-50 ${showNotif ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-[#1E3A5F]">Excellent match !</p>
              <p className="text-sm text-gray-400">Score de 92 pour Jean Dupont</p>
            </div>
          </div>

          {/* Badge animé */}
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-400 uppercase">Badge Pulse</p>
            <div className="relative inline-block">
              <Bell size={28} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                3
              </span>
            </div>
          </div>

          {/* Badge bounce */}
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-400 uppercase">Badge Bounce</p>
            <div className="relative inline-block">
              <Mail size={28} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                5
              </span>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 5. SKELETON LOADERS */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1E3A5F] mb-4">5. Skeleton Loaders</h2>
          
          <button 
            onClick={() => setShowSkeleton(!showSkeleton)}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 mb-4"
          >
            Toggle Skeleton
          </button>

          {showSkeleton ? (
            <div className="space-y-3">
              {/* Card skeleton */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">85</div>
                <div>
                  <p className="font-medium text-[#1E3A5F]">Appartement T3</p>
                  <p className="text-sm text-gray-400">Fréjus • 250 000 €</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold">67</div>
                <div>
                  <p className="font-medium text-[#1E3A5F]">Maison T4</p>
                  <p className="text-sm text-gray-400">Saint-Raphaël • 380 000 €</p>
                </div>
              </div>
            </div>
          )}

          {/* Shimmer effect */}
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-400 uppercase">Shimmer Effect</p>
            <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-shimmer bg-[length:200%_100%]" />
          </div>
        </div>

        {/* ============================================ */}
        {/* 6. CARDS & LISTES */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1E3A5F] mb-4">6. Cards & Listes</h2>
          
          <button 
            onClick={() => setShowCards(!showCards)}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 mb-4"
          >
            Toggle Animation
          </button>

          {/* Stagger animation */}
          <div className="space-y-2">
            {['Jean Dupont', 'Marie Martin', 'Pierre Durand'].map((name, i) => (
              <div 
                key={name}
                className={`p-3 bg-gray-50 rounded-xl flex items-center gap-3 transition-all duration-500 ${
                  showCards 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 -translate-x-4'
                }`}
                style={{ transitionDelay: showCards ? `${i * 100}ms` : '0ms' }}
              >
                <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center text-white text-sm font-medium">
                  {name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm font-medium text-gray-700">{name}</span>
              </div>
            ))}
          </div>

          {/* Hover card */}
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-400 uppercase">Hover Lift</p>
            <div className="p-4 bg-gray-50 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-white border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-3">
                <Home size={20} className="text-emerald-500" />
                <span className="font-medium text-[#1E3A5F]">Appartement T3 - Fréjus</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 7. ICÔNES ANIMÉES */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1E3A5F] mb-4">7. Icônes Animées</h2>
          
          <div className="grid grid-cols-4 gap-4">
            {/* Spin */}
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <RefreshCw size={20} className="text-[#1E3A5F] animate-spin" />
              </div>
              <p className="text-xs text-gray-400">Spin</p>
            </div>

            {/* Bounce */}
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Zap size={20} className="text-amber-500 animate-bounce" />
              </div>
              <p className="text-xs text-gray-400">Bounce</p>
            </div>

            {/* Pulse */}
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Bell size={20} className="text-red-500 animate-pulse" />
              </div>
              <p className="text-xs text-gray-400">Pulse</p>
            </div>

            {/* Ping */}
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2 relative">
                <span className="absolute w-6 h-6 bg-emerald-400 rounded-full animate-ping opacity-75" />
                <span className="relative w-4 h-4 bg-emerald-500 rounded-full" />
              </div>
              <p className="text-xs text-gray-400">Ping</p>
            </div>

            {/* Wiggle */}
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Star size={20} className="text-amber-500 animate-wiggle" />
              </div>
              <p className="text-xs text-gray-400">Wiggle</p>
            </div>

            {/* Float */}
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Sparkles size={20} className="text-violet-500 animate-float" />
              </div>
              <p className="text-xs text-gray-400">Float</p>
            </div>

            {/* Shake */}
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <X size={20} className="text-red-500 animate-shake" />
              </div>
              <p className="text-xs text-gray-400">Shake</p>
            </div>

            {/* Heartbeat */}
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Heart size={20} className="text-red-500 animate-heartbeat" />
              </div>
              <p className="text-xs text-gray-400">Heartbeat</p>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 8. ACTIONS FEEDBACK */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1E3A5F] mb-4">8. Actions Feedback</h2>
          
          {/* Delete with shake */}
          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase">Delete Shake</p>
            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between group hover:bg-red-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">Item à supprimer</span>
              <button className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-100 transition-colors group-hover:animate-shake">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Send animation */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-400 uppercase">Send Animation</p>
            <button className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg flex items-center gap-2 group">
              <span>Envoyer</span>
              <Send size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </button>
          </div>

          {/* Expand arrow */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-400 uppercase">Expand Arrow</p>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2 group">
              <span>Voir plus</span>
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Add with pop */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-400 uppercase">Add Pop</p>
            <button className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 hover:rotate-90 hover:shadow-lg">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* 9. EMPTY STATES */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#1E3A5F] mb-4">9. Empty States</h2>
          
          <div className="text-center py-6">
            <div className="relative w-20 h-20 mx-auto mb-4">
              {/* Cercles animés */}
              <div className="absolute inset-0 bg-[#1E3A5F]/10 rounded-full animate-ping" />
              <div className="absolute inset-2 bg-[#1E3A5F]/20 rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Building2 size={32} className="text-[#1E3A5F] animate-float" />
              </div>
            </div>
            <h3 className="font-semibold text-[#1E3A5F] mb-1">Aucun bien disponible</h3>
            <p className="text-sm text-gray-400 mb-4">Importez vos biens pour commencer</p>
            <button className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium transition-all hover:scale-105">
              Importer
            </button>
          </div>
        </div>

      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 2s ease-out forwards;
        }

        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1); }
          75% { transform: scale(1.1); }
        }
        .animate-heartbeat {
          animation: heartbeat 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default AnimationsDemo