import { useState, useEffect } from 'react'
import { Send, CheckCircle2, XCircle, Eye, Mail, Edit3, RotateCcw, Sparkles } from 'lucide-react'

function EmailModal({
  isOpen,
  onClose,
  type,
  data,
  onConfirm,
  isLoading,
  previewHtml,
  previewLoading,
  emailContent,
  setEmailContent,
  onRegeneratePreview
}) {
  const [activeTab, setActiveTab] = useState('preview')

  useEffect(() => {
    if (isOpen && type === 'confirm') {
      setActiveTab('preview')
    }
  }, [isOpen, type])

  if (!isOpen) return null

  const handleContentChange = (field, value) => {
    setEmailContent((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative bg-white rounded-2xl shadow-2xl mx-4 overflow-hidden animate-in fade-in zoom-in duration-200 ${type === 'confirm' ? 'w-full max-w-4xl max-h-[90vh] flex flex-col' : 'w-full max-w-md'}`}>
        {type === 'confirm' && (
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8A] px-6 py-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Send size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Envoyer la proposition</h3>
                  <p className="text-white/70 text-sm">à {data?.prospectNom}</p>
                </div>
              </div>

              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'preview'
                      ? 'bg-white text-[#1E3A5F]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Eye size={16} />
                  Aperçu
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'edit'
                      ? 'bg-white text-[#1E3A5F]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Edit3 size={16} />
                  Modifier
                </button>
                <button
                  onClick={() => setActiveTab('confirm')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'confirm'
                      ? 'bg-white text-[#1E3A5F]'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Mail size={16} />
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}

        {type === 'success' && (
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Email envoyé !</h3>
                <p className="text-white/70 text-sm">Proposition transmise avec succès</p>
              </div>
            </div>
          </div>
        )}

        {type === 'error' && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Erreur d'envoi</h3>
                <p className="text-white/70 text-sm">Une erreur est survenue</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {type === 'confirm' && data && (
            <>
              {activeTab === 'preview' && (
                <div>
                  {previewLoading ? (
                    <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <div className="w-8 h-8 border-3 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Génération de l'aperçu...</p>
                      </div>
                    </div>
                  ) : previewHtml ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-100">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                          </div>
                          <span className="text-xs text-gray-500 ml-2">Aperçu de l'email</span>
                        </div>
                        <button
                          onClick={() => setActiveTab('edit')}
                          className="text-xs text-[#1E3A5F] hover:text-[#2D5A8A] font-medium flex items-center gap-1"
                        >
                          <Edit3 size={12} />
                          Personnaliser
                        </button>
                      </div>
                      <iframe
                        srcDoc={previewHtml}
                        title="Aperçu email"
                        className="w-full h-[500px] bg-white"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-xl">
                      <p className="text-gray-400">Impossible de charger l'aperçu</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => setActiveTab('confirm')}
                      className="flex-1 px-4 py-3 bg-[#1E3A5F] text-white rounded-xl font-medium hover:bg-[#2D5A8A] transition-colors flex items-center justify-center gap-2"
                    >
                      <Send size={16} />
                      Continuer
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'edit' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Sparkles size={18} />
                      <p className="text-sm font-medium">Personnalisez votre email avant l'envoi</p>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Les modifications seront visibles dans l'aperçu après avoir cliqué sur "Mettre à jour"</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sujet de l'email</label>
                    <input
                      type="text"
                      value={emailContent?.subject || ''}
                      onChange={(e) => handleContentChange('subject', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Introduction</label>
                    <textarea
                      value={emailContent?.intro || ''}
                      onChange={(e) => handleContentChange('intro', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] resize-none"
                      placeholder="Suite à notre échange, j'ai identifié un bien qui pourrait vous intéresser..."
                    />
                    <p className="text-xs text-gray-400 mt-1">Texte après "Bonjour [Nom],"</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        Points forts
                      </span>
                    </label>
                    <textarea
                      value={emailContent?.points_forts || ''}
                      onChange={(e) => handleContentChange('points_forts', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] resize-none"
                      placeholder="Séparez chaque point par un saut de ligne"
                    />
                    <p className="text-xs text-gray-400 mt-1">Un point par ligne</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conclusion</label>
                    <textarea
                      value={emailContent?.conclusion || ''}
                      onChange={(e) => handleContentChange('conclusion', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] resize-none"
                      placeholder="Ce bien vous intéresse ? N'hésitez pas à me contacter..."
                    />
                    <p className="text-xs text-gray-400 mt-1">Texte avant "À très bientôt,"</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lien de l'annonce</label>
                    <input
                      type="url"
                      value={emailContent?.lien_annonce || ''}
                      onChange={(e) => handleContentChange('lien_annonce', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                      placeholder="https://... (laissez vide pour utiliser la page publique ImmoMatch)"
                    />
                    <p className="text-xs text-gray-400 mt-1">URL du bouton "Voir ce bien" dans l'email</p>
                  </div>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Annuler
                    </button>
                    <button
                      onClick={() => { onRegeneratePreview(); setActiveTab('preview') }}
                      disabled={previewLoading}
                      className="flex-1 px-4 py-3 bg-[#1E3A5F] text-white rounded-xl font-medium hover:bg-[#2D5A8A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {previewLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Mettre à jour l'aperçu
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'confirm' && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-500 mb-1">Destinataire</p>
                    <p className="font-medium text-gray-900">{data.prospectNom}</p>
                    <p className="text-sm text-[#1E3A5F]">{data.prospectMail}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-500 mb-1">Sujet</p>
                    <p className="font-medium text-gray-900 text-sm">{emailContent?.subject || ''}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-500 mb-1">Bien proposé</p>
                    <p className="font-medium text-gray-900">{data.bienType} à {data.bienVille}</p>
                    <p className="text-sm text-[#1E3A5F] font-semibold">{data.bienPrix}</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-amber-800">
                      <strong>Confirmation :</strong> L'email sera envoyé immédiatement à {data.prospectMail}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveTab('preview')}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Revoir l'aperçu
                    </button>
                    <button
                      onClick={onConfirm}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Envoyer maintenant
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {type === 'success' && data && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <p className="text-gray-600">
                  La proposition pour <span className="font-medium text-gray-900">{data.bienType} à {data.bienVille}</span> a été envoyée à <span className="font-medium text-gray-900">{data.prospectNom}</span>.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                Parfait !
              </button>
            </>
          )}

          {type === 'error' && data && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle size={32} className="text-red-600" />
                </div>
                <p className="text-gray-600 mb-2">
                  L'envoi de l'email a échoué.
                </p>
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {data.error || 'Erreur inconnue'}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailModal