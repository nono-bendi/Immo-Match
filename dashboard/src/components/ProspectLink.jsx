import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
        className={`text-[#1E3A5F] hover:text-[#2D5A8A] hover:underline font-medium cursor-pointer ${className}`}
      >
        {children || prospect.nom || 'Sans nom'}
      </button>

      {showModal && !fullProspect && loading && createPortal(
        <div className="fixed inset-0 lg:left-64 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <Loader2 size={32} className="animate-spin text-white" />
        </div>,
        document.body
      )}

      {showModal && fullProspect && createPortal(
        <ProspectModal prospect={fullProspect} onClose={() => setShowModal(false)} />,
        document.body
      )}
    </>
  )
}

export default ProspectLink
