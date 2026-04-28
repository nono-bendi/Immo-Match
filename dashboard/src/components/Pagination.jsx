import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null

  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages]
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  return (
    <div className="w-full flex items-center justify-end gap-1 py-4 px-4">

      {/* Précédent */}
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-[#1E3A5F] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-[#f0f5fb] dark:text-slate-300 dark:hover:bg-white/5 transition-all"
      >
        <ChevronLeft size={17} strokeWidth={2.5} />
      </button>

      {/* Pages */}
      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
            ···
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-700 transition-all
              ${page === currentPage
                ? 'bg-[#1E3A5F] text-white font-bold shadow-md shadow-[#1E3A5F]/30 scale-105'
                : 'text-slate-500 hover:bg-[#f0f5fb] dark:text-slate-400 dark:hover:bg-white/5 font-medium'
              }`}
          >
            {page}
          </button>
        )
      )}

      {/* Suivant */}
      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-[#1E3A5F] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-[#f0f5fb] dark:text-slate-300 dark:hover:bg-white/5 transition-all"
      >
        <ChevronRight size={17} strokeWidth={2.5} />
      </button>

    </div>
  )
}