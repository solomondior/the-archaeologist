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

  return (
    <div className="flex gap-8">
      <FilterSidebar filters={filters} onChange={setFilters} />
      <div className="flex-1 min-w-0">
        <ArchiveTable digs={digs} filters={filters} />
      </div>
    </div>
  )
}
