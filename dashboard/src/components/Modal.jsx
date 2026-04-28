import { CheckCircle, AlertTriangle, HelpCircle, X } from 'lucide-react'

function Modal({ isOpen, onClose, onConfirm, title, message, type = 'info', confirmText = 'OK', cancelText = 'Annuler', showCancel = false }) {
  if (!isOpen) return null

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header avec close */}
        <div className="flex justify-end p-2">
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            {type === 'success' && (
              <div className="animate-bounce-in">
                <CheckCircle size={48} className="text-emerald-500" />
              </div>
            )}
            {type === 'warning' && (
              <div className="animate-shake">
                <AlertTriangle size={48} className="text-amber-500" />
              </div>
            )}
            {type === 'error' && (
              <div className="animate-shake">
                <AlertTriangle size={48} className="text-red-500" />
              </div>
            )}
            {(type === 'info' || type === 'confirm') && (
              <div className="animate-pulse-slow">
                <HelpCircle size={48} className="text-[#1E3A5F]" />
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-[#1E3A5F] mb-2">{title}</h3>
          <p className="text-gray-600 whitespace-pre-line">{message}</p>
          
          {/* Buttons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {showCancel && (
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`px-6 py-2.5 font-semibold rounded-xl transition-colors ${
                type === 'error' 
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : type === 'warning'
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-[#1E3A5F] text-white hover:bg-[#2D5A8A]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
      
      {/* Styles pour les animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default Modal