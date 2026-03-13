// src/components/Skeleton.jsx

// Skeleton pour une card de bien/prospect
export function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="w-12 h-12 rounded-xl animate-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-4 rounded animate-shimmer w-3/4" />
        <div className="h-3 rounded animate-shimmer w-1/2" />
      </div>
    </div>
  )
}

// Skeleton pour une ligne de tableau
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100">
      <div className="w-10 h-10 rounded-lg animate-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-4 rounded animate-shimmer w-1/3" />
        <div className="h-3 rounded animate-shimmer w-1/4" />
      </div>
      <div className="h-4 rounded animate-shimmer w-20" />
      <div className="h-4 rounded animate-shimmer w-16" />
    </div>
  )
}

// Skeleton pour liste complète
export function SkeletonList({ count = 5 }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

export default { SkeletonCard, SkeletonRow, SkeletonList }