import { Upload } from 'lucide-react'
import { useState } from 'react'
import { apiFetch } from '../api'

function ImportButton({ onImportSuccess }) {
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await apiFetch(`/prospects/import`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      alert(data.message)
      onImportSuccess()
    } catch (error) {
      alert('Erreur lors de l\'import')
      console.error(error)
    }

    setLoading(false)
    event.target.value = ''
  }

  return (
    <label className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 cursor-pointer">
      <Upload size={18} />
      {loading ? 'Import en cours...' : 'Importer Excel'}
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  )
}

export default ImportButton