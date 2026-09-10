// Petit badge "exemple" pour les prospects de démonstration (prospect.demo = 1).
// Affiché partout où un prospect exemple apparaît : listes, matchings, tableau de bord.
function ExempleTag({ show = true, style }) {
  if (!show) return null
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 500,
        lineHeight: 1.2,
        color: '#94a3b8',
        border: '1px dashed #cbd5e1',
        borderRadius: 4,
        padding: '1px 6px',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      exemple
    </span>
  )
}

export default ExempleTag
