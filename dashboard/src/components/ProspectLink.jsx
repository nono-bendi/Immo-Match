import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '../api'
import ProspectModal from './ProspectModal'

function ProspectLink({ prospect, children, className = '' }) {
  const [showModal, setShowModal] = useState(false)
  const [fullProspect, setFullProspect] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (showModal && prospect?.id && !fullProspect) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true)
      apiFetch(`/prospects/${prospect.id}`)
        .then(res => res.json())
        .then(data => {
          setFullProspect(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [showModal, prospect?.id, fullProspect])

  if (!prospect) return children || '-'

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setShowModal(true) }}
        className={`text-[#2563eb] hover:text-[#3b82f6] hover:underline font-medium cursor-pointer ${className}`}
      >
        {children || prospect.nom || 'Sans nom'}
      </button>

      {showModal && !fullProspect && loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <Loader2 size={32} className="animate-spin text-white" />
        </div>
      )}

      {showModal && fullProspect && (
        <ProspectModal prospect={fullProspect} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

export default ProspectLink
