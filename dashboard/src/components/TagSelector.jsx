// src/components/TagSelector.jsx
import { useState, useRef, useEffect } from 'react'
import { Flame, Sun, Snowflake, X } from 'lucide-react'
import { API_URL } from '../config'

const TAGS = [
  { value: 'chaud', label: 'Chaud', icon: Flame, color: 'bg-red-500', lightBg: 'bg-red-50', text: 'text-red-600' },
  { value: 'tiede', label: 'Tiède', icon: Sun, color: 'bg-amber-500', lightBg: 'bg-amber-50', text: 'text-amber-600' },
  { value: 'froid', label: 'Froid', icon: Snowflake, color: 'bg-blue-500', lightBg: 'bg-blue-50', text: 'text-blue-600' },
]

function TagSelector({ prospectId, currentTag, onTagChange, size = 'md' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const dropdownRef = useRef(null)

  // Fermer le dropdown si clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectTag = async (tagValue) => {
    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/prospects/${prospectId}/tag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: tagValue })
      })
      if (response.ok) {
        onTagChange && onTagChange(tagValue)
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
    setSaving(false)
    setIsOpen(false)
  }

  const handleRemoveTag = async (e) => {
    e.stopPropagation()
    await handleSelectTag(null)
  }

  const currentTagData = TAGS.find(t => t.value === currentTag)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton principal */}
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        disabled={saving}
        className={`
          rounded-lg font-medium transition-all flex items-center gap-1.5
          ${sizeClasses[size]}
          ${currentTagData 
            ? `${currentTagData.lightBg} ${currentTagData.text} hover:opacity-80` 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
          }
          ${saving ? 'opacity-50' : ''}
        `}
      >
        {saving ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : currentTagData ? (
          <>
            <currentTagData.icon size={size === 'sm' ? 10 : 12} />
            {currentTagData.label}
            <X 
              size={size === 'sm' ? 10 : 12} 
              className="ml-0.5 hover:opacity-70" 
              onClick={handleRemoveTag}
            />
          </>
        ) : (
          <span>+ Tag</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 min-w-[120px] animate-fade-in-up">
          {TAGS.map(tag => (
            <button
              key={tag.value}
              onClick={(e) => { e.stopPropagation(); handleSelectTag(tag.value) }}
              className={`
                w-full px-3 py-2 flex items-center gap-2 text-sm transition-colors
                ${currentTag === tag.value ? tag.lightBg : 'hover:bg-gray-50'}
              `}
            >
              <div className={`w-6 h-6 ${tag.color} rounded-lg flex items-center justify-center`}>
                <tag.icon size={14} className="text-white" />
              </div>
              <span className={currentTag === tag.value ? tag.text : 'text-gray-700'}>
                {tag.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Export aussi les tags pour réutiliser ailleurs
export { TAGS }
export default TagSelector