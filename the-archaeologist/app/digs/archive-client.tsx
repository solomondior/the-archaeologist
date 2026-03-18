'use client'

import { useState } from 'react'
import { FilterSidebar, type FilterState } from '@/components/filter-sidebar'
import { ArchiveTable } from '@/components/archive-table'
import type { DigRow } from '@/lib/supabase/types'

interface ArchiveClientProps {
  digs: DigRow[]
}

export function ArchiveClient({ digs }: ArchiveClientProps) {
  const [filters, setFilters] = useState<FilterState>({ causes: [], sortBy: 'newest' })
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="search by token name or address…"
        className="w-full bg-[#111] border border-[#1a1a1a] text-xs text-[#e8e8e8] px-3 py-2 focus:outline-none focus:border-[#d97706] placeholder-[#333]"
      />
      <div className="flex gap-8">
        <FilterSidebar filters={filters} onChange={setFilters} />
        <div className="flex-1 min-w-0">
          <ArchiveTable digs={digs} filters={filters} search={search} />
        </div>
      </div>
    </div>
  )
}
