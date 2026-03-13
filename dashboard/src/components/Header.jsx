import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Clock, LayoutDashboard, Users, UserPlus, Shuffle, Building2, History, Settings, SlidersHorizontal, Menu } from 'lucide-react'
import NotificationBell from './NotificationBell'
import UserMenu from './UserMenu'
import { API_URL } from '../config'

const PAGES = {
  '/':                { title: 'Tableau de bord',   subtitle: "Vue d'ensemble de votre activité",    icon: LayoutDashboard },
  '/clients':         { title: 'Clients',            subtitle: 'Gérez vos prospects',                 icon: Users },
  '/clients/nouveau': { title: 'Nouveau prospect',   subtitle: 'Ajouter un nouveau client',           icon: UserPlus },
  '/matchings':       { title: 'Matchings',          subtitle: 'Résultats des analyses IA',           icon: Shuffle },
  '/biens':           { title: 'Biens',              subtitle: 'Catalogue des propriétés',            icon: Building2 },
  '/historique':      { title: 'Historique',         subtitle: 'Historique des actions',              icon: History },
  '/parametres':      { title: 'Paramètres',         subtitle: "Configuration de l'application",     icon: Settings },
  '/calibration':     { title: 'Calibration',        subtitle: 'Évaluez la pertinence des matchings', icon: SlidersHorizontal },
}

function formatDerniereAnalyse(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const diff = Date.now() - date
  const h = Math.floor(diff / 3600000)
  const j = Math.floor(h / 24)
  if (h < 1) return "À l'instant"
  if (h < 24) return `Il y a ${h}h`
  if (j < 7) return `Il y a ${j}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function Header({ onOpenTutorial, onToggleSidebar, darkToggle }) {
  const location = useLocation()
  const [derniereAnalyse, setDerniereAnalyse] = useState(null)
  const [titleKey, setTitleKey] = useState(0)

  const page = PAGES[location.pathname] || { title: 'ImmoMatch', subtitle: '' }

  useEffect(() => {
    setTitleKey(k => k + 1)
  }, [location.pathname])

  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then(r => r.json())
      .then(d => setDerniereAnalyse(d.derniere_analyse || null))
      .catch(() => {})
  }, [location.pathname])

  const analyseLabel = formatDerniereAnalyse(derniereAnalyse)
  const Icon = page.icon

  return (
    <>
      <style>{`
        @keyframes hdr-enter {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes title-enter {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chip-enter {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        .hdr-wrap { animation: hdr-enter 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .hdr-title { animation: title-enter 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .hdr-chip  { animation: chip-enter 0.4s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .hdr-guide {
          position: relative; overflow: hidden;
          transition: color 0.2s, border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .hdr-guide:hover {
          color: #1E3A5F !important; border-color: #1E3A5F !important;
          background: #f0f5fb !important; transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30,58,95,0.1);
        }
        .hdr-guide:active { transform: translateY(0); }
      `}</style>

      <header
        className="hdr-wrap sticky top-0 z-40 flex items-center justify-between bg-white border-b border-[#e8eef5] px-4 md:px-9"
        style={{ height: 64, boxShadow: '0 1px 0 #e8eef5, 0 4px 24px rgba(30,58,95,0.04)' }}
      >

        {/* ── Gauche : hamburger (mobile) + titre ── */}
        <div className="flex items-center gap-3 min-w-0">

          {/* Hamburger — visible seulement sur mobile */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-[#1E3A5F] hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Icône page */}
          {Icon && (
            <div
              className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-[13px] items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8A 100%)', boxShadow: '0 4px 14px rgba(30,58,95,0.22)' }}
            >
              <Icon size={19} color="white" strokeWidth={2} />
            </div>
          )}

          {/* Titre + sous-titre */}
          <div key={titleKey} className="hdr-title min-w-0">
            <h1 className="text-lg md:text-2xl font-extrabold text-[#1E3A5F] leading-none tracking-tight truncate" style={{ letterSpacing: '-0.04em' }}>
              {page.title}
            </h1>
            <p className="hidden sm:block text-xs text-[#94a3b8] mt-0.5 truncate">{page.subtitle}</p>
          </div>
        </div>

        {/* ── Droite ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          <span className="hidden lg:contents">{darkToggle}</span>

          {/* Guide — masqué sur très petit mobile */}
          <button
            className="hdr-guide hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold text-[#64748b] border border-[#dde4ee] bg-transparent cursor-pointer"
            onClick={onOpenTutorial}
          >
            Guide
          </button>

          <div className="hidden sm:block w-px h-7 bg-[#e8eef5] mx-1" />

          <NotificationBell />

          {/* Chip dernière analyse — masqué sur mobile */}
          {analyseLabel && (
            <div
              className="hdr-chip hidden md:flex items-center gap-2 px-3 h-10 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl"
            >
              <div
                className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1E3A5F, #2D5A8A)' }}
              >
                <Clock size={13} color="white" />
              </div>
              <div>
                <p className="text-[10px] text-[#94a3b8] font-semibold uppercase leading-none mb-0.5" style={{ letterSpacing: '0.06em' }}>
                  Dernière analyse
                </p>
                <p className="text-[13px] font-bold text-[#1E3A5F] leading-none" style={{ letterSpacing: '-0.01em' }}>
                  {analyseLabel}
                </p>
              </div>
            </div>
          )}

          <div className="hidden sm:block w-px h-7 bg-[#e8eef5] mx-1" />

          <UserMenu />
        </div>
      </header>
    </>
  )
}

export default Header