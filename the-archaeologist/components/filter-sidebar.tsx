'use client'

export type CauseFilter = 'rug' | 'abandonment' | 'whale_exit' | 'natural_decay' | 'unknown'
export type SortOption = 'newest' | 'oldest' | 'highest_peak' | 'most_holders'

export interface FilterState {
  causes: CauseFilter[]
  sortBy: SortOption
}

interface FilterSidebarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

const CAUSES: { value: CauseFilter; label: string }[] = [
  { value: 'rug', label: 'rug' },
  { value: 'abandonment', label: 'abandonment' },
  { value: 'whale_exit', label: 'whale exit' },
  { value: 'natural_decay', label: 'natural decay' },
  { value: 'unknown', label: 'unknown' },
]

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'newest' },
  { value: 'oldest', label: 'oldest' },
  { value: 'highest_peak', label: 'highest peak' },
  { value: 'most_holders', label: 'most holders' },
]

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const toggleCause = (cause: CauseFilter) => {
    const next = filters.causes.includes(cause)
      ? filters.causes.filter((c) => c !== cause)
      : [...filters.causes, cause]
    onChange({ ...filters, causes: next })
  }

  return (
    <aside className="w-44 shrink-0 border-r border-[#1a1a1a] pr-4 space-y-6">
      <div>
        <div className="text-[10px] text-[#d97706] tracking-widest mb-3">CAUSE OF DEATH</div>
        <div className="space-y-2">
          {CAUSES.map((c) => (
            <label key={c.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.causes.includes(c.value)}
                onChange={() => toggleCause(c.value)}
                className="accent-[#d97706]"
              />
              <span className="text-xs text-[#888]">{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-[#d97706] tracking-widest mb-3">SORT BY</div>
        <div className="space-y-2">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange({ ...filters, sortBy: s.value })}
              className={`block text-xs transition-colors ${
                filters.sortBy === s.value ? 'text-[#e8e8e8]' : 'text-[#555] hover:text-[#888]'
              }`}
            >
              {filters.sortBy === s.value ? '› ' : ''}
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
