import { useState, useEffect } from 'react'
import {
  Users, Building2, Star, TrendingUp, Phone, Mail, Home,
  ArrowRight, Zap, Target, AlertTriangle, Sparkles,
  BarChart2, Activity, ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProspectLink from '../components/ProspectLink'
import BienLink from '../components/BienLink'
import BienModal from '../components/BienModal'
import { API_URL } from '../config'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'


/* ─── Compteur animé ──────────────────────────────────── */
function Counter({ to, duration = 1100 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!to) return
    const t0 = performance.now()
    const f = n => {
      const p = Math.min((n - t0) / duration, 1)
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
  }, [duration, to])
  return <>{val.toLocaleString('fr-FR')}</>
}

/* ─── Tooltip graphique ───────────────────────────────── */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: '#0f1e30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 3 }}>{d?.date}</p>
      <p style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
        {d?.score_moyen}<span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: 11 }}>/100</span>
      </p>
      <p style={{ color: '#34d399', fontSize: 11, marginTop: 2 }}>
        {d?.excellents} excellent{d?.excellents !== 1 ? 's' : ''} · {d?.nb_matchings} matchings
      </p>
    </div>
  )
}

/* ─── KPI Card — blanc sobre, fade-in au chargement ─────── */
function KpiCard({ icon: Icon, label, value, custom, badge, barPct, iconColor, iconBg, delay, onClick, valueColor }) {
  return (
    <div
      className="kpi-card-wrap"
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: '22px 22px 18px',
        border: '1px solid #edf1f7',
        borderTop: `3px solid ${iconColor}`,
        cursor: 'pointer',
        opacity: 0,
        transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease',
        '--icon-color': iconColor,
        '--icon-bg': iconBg,
      }}>

      {/* Icône + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="kpi-icon-wrap" style={{
          width: 38, height: 38, borderRadius: 11,
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.28s ease', flexShrink: 0
        }}>
          <Icon size={16} className="kpi-icon-svg" style={{ color: iconColor, transition: 'color 0.28s' }} />
        </div>
        {badge && (
          <span className="kpi-badge" style={{
            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
            background: badge.bg, color: badge.color,
            display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
            '--badge-color': badge.color
          }}>
            {badge.dot && <span className="dot-pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: badge.color, display: 'inline-block' }} />}
            {badge.text}
          </span>
        )}
      </div>

      {/* Valeur */}
      <div style={{ marginBottom: 4 }}>
        {custom || (
          <p style={{ fontSize: 32, fontWeight: 800, color: valueColor || '#1E3A5F', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
            <Counter to={value} />
          </p>
        )}
      </div>
      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: barPct !== undefined ? 14 : 0 }}>{label}</p>

      {/* Barre optionnelle */}
      {barPct !== undefined && (
        <div style={{ height: 3, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99, background: iconColor,
            animation: `kpi-bar-fill 1.2s cubic-bezier(0.22,1,0.36,1) calc(${delay || '0s'} + 0.3s) both`,
            width: `${barPct}%`
          }} />
        </div>
      )}
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────── */
export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedBien, setSelectedBien] = useState(null)
  const navigate = useNavigate()

  const openBien = (id) => {
    fetch(`${API_URL}/biens/${id}`)
      .then(r => r.json())
      .then(d => setSelectedBien(d))
      .catch(() => {})
  }

  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => { setLoading(false); setError(true) })
  }, [])

  const fmt = b => b
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(b)
    : '—'
  const fmtDate = s => {
    if (!s) return 'Jamais'
    // eslint-disable-next-line react-hooks/purity
    const d = new Date(s), diff = Date.now() - d
    const h = Math.floor(diff / 3600000), j = Math.floor(h / 24)
    if (h < 1) return "À l'instant"
    if (h < 24) return `Il y a ${h}h`
    if (j < 7) return `Il y a ${j}j`
    return d.toLocaleDateString('fr-FR')
  }
  const scoreColor = s => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'
  const scoreRate = stats?.nb_matchings > 0 ? Math.round((stats.excellents / stats.nb_matchings) * 100) : 0

  const distConfig = [
    { label: '90-100', color: '#059669' },
    { label: '80-89',  color: '#10b981' },
    { label: '70-79',  color: '#34d399' },
    { label: '60-69',  color: '#f59e0b' },
    { label: '50-59',  color: '#fbbf24' },
    { label: '< 50',   color: '#f87171' },
  ]
  const maxDist = stats?.distribution?.length > 0
    ? Math.max(...stats.distribution.map(d => d.nb || 0), 1) : 1

  const evolDelta = (() => {
    const e = stats?.evolution || []
    if (e.length < 2) return null
    return ((e[e.length-1]?.score_moyen||0) - (e[e.length-2]?.score_moyen||0)).toFixed(1)
  })()

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, gap: 12 }}>
      <AlertTriangle size={24} style={{ color: '#f87171' }} />
      <p style={{ fontWeight: 600, color: '#374151' }}>{`Backend inaccessible — vérifiez que FastAPI tourne sur ${API_URL}`}</p>
      <button onClick={() => window.location.reload()}
        style={{ padding: '8px 18px', background: '#1E3A5F', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
        Réessayer
      </button>
    </div>
  )

  if (loading) return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-32 animate-shimmer" />)}
      </div>
      <div className="bg-white rounded-2xl h-72 animate-shimmer" />
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Bandeau statut — sobre ───────────────────────── */}
      {(stats?.prospects_sans_matching||[]).length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 20px', borderRadius: 14,
          background: '#fffbeb', border: '1px solid #fde68a'
        }}>
          <span className="dot-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: '#92400e', flex: 1 }}>
            <strong>{stats.prospects_sans_matching.length} prospect{stats.prospects_sans_matching.length > 1 ? 's' : ''}</strong> en attente d'analyse IA
          </p>
          <button onClick={() => navigate('/matchings')}
            style={{ padding: '6px 14px', background: '#f59e0b', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseOver={e => e.currentTarget.style.background = '#d97706'}
            onMouseOut={e => e.currentTarget.style.background = '#f59e0b'}>
            <Zap size={13} /> Analyser
          </button>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            Dernière analyse : <strong style={{ color: '#6b7280' }}>{fmtDate(stats?.derniere_analyse)}</strong>
          </span>
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={Users} label="Prospects actifs"
          value={stats?.nb_prospects || 0}
          iconColor="#3b82f6" iconBg="#eff6ff"
          valueColor="#3b82f6"
          delay="0.05s" onClick={() => navigate('/clients')}
          badge={(stats?.prospects_sans_matching||[]).length > 0
            ? { text: `${stats.prospects_sans_matching.length} à analyser`, color: '#d97706', bg: '#fef3c7', dot: true }
            : { text: 'Tous analysés ✓', color: '#059669', bg: '#f0fdf4' }}
        />
        <KpiCard
          icon={Building2} label="Biens catalogue"
          value={stats?.nb_biens || 0}
          iconColor="#10b981" iconBg="#f0fdf4"
          valueColor="#10b981"
          delay="0.13s" onClick={() => navigate('/biens')}
          badge={{ text: 'Groupement Primmo', color: '#2563eb', bg: '#eff6ff' }}
        />
        <KpiCard
          icon={Star} label="Excellents matchs"
          value={stats?.excellents || 0}
          iconColor="#7c3aed" iconBg="#f5f3ff"
          valueColor="#7c3aed"
          delay="0.21s" onClick={() => navigate('/matchings')}
          badge={{ text: `${scoreRate}% du total`, color: '#7c3aed', bg: '#f5f3ff' }}
          barPct={scoreRate}
        />
        <KpiCard
          icon={TrendingUp} label="Score global IA"
          iconColor="#f59e0b" iconBg="#fffbeb"
          delay="0.29s" onClick={() => navigate('/matchings')}
          value={stats?.score_global || 0}
          valueColor="#f59e0b"
          badge={{ text: `${stats?.nb_matchings || 0} matchings`, color: '#6b7280', bg: '#f9fafb' }}
          barPct={stats?.score_global || 0}
        />
      </div>

            {/* ── Centre action ─────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-5">

        {/* À contacter */}
        <div className="col-span-3 bg-white rounded-2xl section-card overflow-hidden">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="sec-icon sec-icon--navy">
                <Zap size={15} className="sec-icon-svg" />
              </div>
              <div>
                <h2 className="section-title" style={{ fontSize: 14, fontWeight: 700, color: '#1E3A5F', marginBottom: 1 }}>À contacter en priorité</h2>
                <p className="section-sub" style={{ fontSize: 11, color: '#94a3b8' }}>{stats?.top_matchings?.length || 0} meilleurs matchs — agissez maintenant</p>
              </div>
            </div>
            <button onClick={() => navigate('/matchings')}
              className="sec-link-btn">
              Tout voir <ArrowRight size={12} />
            </button>
          </div>

          {(stats?.top_matchings||[]).length > 0 ? (
            <div>
              {stats.top_matchings.slice(0, 5).map((m, i) => {
                const color = scoreColor(m.score)
                const isTop = m.score >= 85
                return (
                  <div key={m.id} className="dash-match-row"
                    onClick={() => navigate('/matchings', { state: { prospectId: m.prospect_id } })}
                    style={{
                      padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16,
                      borderBottom: i < 4 ? '1px solid #f8fafc' : 'none',
                      transition: 'background 0.2s ease', cursor: 'pointer',
                    }}>

                    {/* Score */}
                    <div className={isTop ? 'match-score-top' : ''}
                      style={{
                        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                        background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: 15
                      }}>
                      {m.score}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span onClick={e => e.stopPropagation()}>
                          <ProspectLink prospect={{
                            id: m.prospect_id,
                            nom: m.prospect_nom,
                            mail: m.prospect_mail,
                            telephone: m.prospect_tel,
                            budget_max: m.prospect_budget
                          }} className="row-name">
                            {m.prospect_nom}
                          </ProspectLink>
                        </span>
                        {isTop && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: '#f0fdf4', color: '#059669', flexShrink: 0 }}>
                            COUP DE CŒUR
                          </span>
                        )}
                      </div>
                      <div className="row-sub" style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Home size={10} style={{ flexShrink: 0 }} />
                        <span onClick={e => e.stopPropagation()}>
                          <BienLink bien={{
                            id: m.bien_id,
                            type: m.bien_type,
                            ville: m.bien_ville,
                            prix: m.bien_prix,
                            surface: m.bien_surface
                          }} className="row-sub" />
                        </span>
                      </div>
                      {m.recommandation && (
                        <p style={{ fontSize: 11, color: '#94a3b8', opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', marginTop: 2 }}>
                          {m.recommandation}
                        </p>
                      )}
                    </div>

                    {/* CTA — visible au hover CSS */}
                    <div className="dash-match-cta" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {m.prospect_tel && (
                        <a href={`tel:${m.prospect_tel.replace(/,/g,'')}`}
                          style={{ width: 34, height: 34, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                          onClick={e => e.stopPropagation()}>
                          <Phone size={14} style={{ color: '#059669' }} />
                        </a>
                      )}
                      {m.prospect_mail && (
                        <a href={`mailto:${m.prospect_mail}`}
                          style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                          onClick={e => e.stopPropagation()}>
                          <Mail size={14} style={{ color: '#3b82f6' }} />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: 56, textAlign: 'center' }}>
              <Sparkles size={26} style={{ color: '#e2e8f0', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Lancez une analyse pour voir les priorités</p>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="col-span-2 flex flex-col gap-4">

          {/* Distribution */}
          <div className="bg-white rounded-2xl section-card overflow-hidden">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="sec-icon sec-icon--violet">
                  <Activity size={14} className="sec-icon-svg" />
                </div>
                <div>
                  <h2 className="section-title" style={{ fontSize: 13, fontWeight: 700, color: '#1E3A5F' }}>Qualité des matchs</h2>
                  <p className="section-sub" style={{ fontSize: 11, color: '#94a3b8' }}>Meilleur score par prospect</p>
                </div>
              </div>
              <span className="sec-score-val">
                {stats?.score_global||0}<span className="sec-score-sub">/100</span>
              </span>
            </div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {distConfig.map(({ label, color }, i) => {
                const found = (stats?.distribution||[]).find(d => d.tranche === label)
                const nb = found?.nb || 0
                const pct = maxDist > 0 ? Math.round((nb / maxDist) * 100) : 0
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="dist-label">{label}</span>
                    <div className="dist-track">
                      <div className="dist-bar-soft"
                        style={{ height: '100%', background: color, borderRadius: 99, width: `${pct}%`, '--i': i }} />
                    </div>
                    <span className="dist-nb">{nb}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top biens */}
          <div className="bg-white rounded-2xl section-card overflow-hidden flex-1">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="sec-icon sec-icon--blue">
                  <Building2 size={14} className="sec-icon-svg" />
                </div>
                <h2 className="section-title" style={{ fontSize: 13, fontWeight: 700, color: '#1E3A5F' }}>Biens les plus demandés</h2>
              </div>
              <button onClick={() => navigate('/biens')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <ArrowRight size={14} style={{ color: '#cbd5e1' }} />
              </button>
            </div>
            <div>
              {(stats?.biens_populaires||[]).filter(b => b.nb_matchings > 0).slice(0, 4).map((b, i) => (
                  <div key={b.id} className="dash-bien-row"
                    style={{
                      padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 10,
                      borderBottom: i < 3 ? '1px solid #f8fafc' : 'none',
                      transition: 'background 0.2s', cursor: 'pointer'
                    }}
                    onClick={() => openBien(b.id)}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, width: 20, flexShrink: 0,
                      color: i === 0 ? '#F5C518' : i === 1 ? '#A8A9AD' : i === 2 ? '#CD7F32' : '#cbd5e1'
                    }}>#{i+1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="row-name" style={{ fontSize: 12, fontWeight: 600, color: '#1E3A5F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.type} · {b.ville}
                      </p>
                      <p className="row-sub">{fmt(b.prix)}{b.surface ? ` · ${b.surface}m²` : ''}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 7, background: '#f5f3ff', color: '#7c3aed', flexShrink: 0 }}>
                      {b.nb_matchings} matchs
                    </span>
                  </div>
              ))}
              {(stats?.biens_populaires||[]).filter(b => b.nb_matchings > 0).length === 0 && (
                <p style={{ padding: '24px 20px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Aucun bien analysé</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Graphique évolution — en bas, sobre ──────────── */}
      <div className="bg-white rounded-2xl section-card overflow-hidden">
        <div style={{ padding: '18px 24px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="sec-icon sec-icon--gray">
              <BarChart2 size={14} className="sec-icon-svg" />
            </div>
            <div>
              <h2 className="section-title" style={{ fontSize: 14, fontWeight: 700, color: '#1E3A5F' }}>Évolution du score IA</h2>
              <p className="section-sub" style={{ fontSize: 11, color: '#94a3b8' }}>Score moyen par session d'analyse</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#94a3b8' }}>
              <span className="chart-legend-item">
                <span style={{ display: 'inline-block', width: 20, borderTop: '2px dashed #10b981' }} /> Excellent (75)
              </span>
              <span className="chart-legend-item">
                <span style={{ display: 'inline-block', width: 20, borderTop: '2px dashed #f59e0b' }} /> Correct (50)
              </span>
            </div>
            {evolDelta !== null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: parseFloat(evolDelta) >= 0 ? '#f0fdf4' : '#fef2f2',
                color: parseFloat(evolDelta) >= 0 ? '#059669' : '#ef4444'
              }}>
                <TrendingUp size={11} style={{ transform: parseFloat(evolDelta) < 0 ? 'rotate(180deg)' : 'none' }} />
                {parseFloat(evolDelta) >= 0 ? '+' : ''}{evolDelta} pts
              </div>
            )}
          </div>
        </div>

        {(stats?.evolution||[]).length > 1 ? (
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={stats.evolution} margin={{ top: 8, right: 24, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.09} />
                  <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={d => { try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) } catch { return d } }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
              <ReferenceLine y={75} stroke="#10b981" strokeDasharray="5 4" strokeWidth={1.5} />
              <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="score_moyen" stroke="#1E3A5F" strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ fill: '#1E3A5F', r: 3.5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#1E3A5F', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#cbd5e1' }}>
            <BarChart2 size={26} />
            <p style={{ fontSize: 12 }}>Lancez des analyses pour voir l'évolution</p>
          </div>
        )}
      </div>

      <BienModal bien={selectedBien} onClose={() => setSelectedBien(null)} />
    </div>
  )
}