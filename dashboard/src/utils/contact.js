// Suivi du dernier contact prospect — partagé entre la liste Clients et la fiche prospect

// Nombre de jours depuis le dernier contact (null si aucune date exploitable)
export const contactDays = (p) => {
  const raw = p.dernier_contact || p.date
  if (!raw) return null
  const d = new Date(String(raw).replace(' ', 'T'))
  if (isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000))
}

// Pastille : vert < 15 j, orange 15-30 j, rouge > 30 j ou jamais contacté
export const contactInfo = (p) => {
  const days = contactDays(p)
  if (days === null) return { days: null, label: 'Jamais', color: '#ef4444' }
  const label = days === 0 ? "Aujourd'hui" : days === 1 ? 'Hier' : days <= 60 ? `Il y a ${days} j` : `Il y a ${Math.floor(days / 30)} mois`
  const color = days < 15 ? '#10b981' : days <= 30 ? '#f59e0b' : '#ef4444'
  return { days, label, color }
}
