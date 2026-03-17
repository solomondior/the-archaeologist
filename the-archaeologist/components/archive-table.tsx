'use client'

import Link from 'next/link'
import type { DigRow } from '@/lib/supabase/types'
import type { FilterState, CauseFilter } from './filter-sidebar'

interface ArchiveTableProps {
  digs: DigRow[]
  filters: FilterState
}

const CAUSE_LABELS: Record<string, string> = {
  rug: 'RUG',
  abandonment: 'ABANDON',
  whale_exit: 'WHALE',
  natural_decay: 'DECAY',
  unknown: '?',
}

const CAUSE_COLORS: Record<string, string> = {
  rug: 'text-red-700',
  abandonment: 'text-[#666]',
  whale_exit: 'text-[#d97706]',
  natural_decay: 'text-[#666]',
  unknown: 'text-[#444]',
}

function formatMcap(n: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function formatMon(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function ArchiveTable({ digs, filters }: ArchiveTableProps) {
  const filtered = digs
    .filter(
      (d) =>
        filters.causes.length === 0 ||
        filters.causes.includes((d.cause_of_death ?? 'unknown') as CauseFilter)
    )
    .sort((a, b) => {
      if (filters.sortBy === 'oldest') return a.dig_number - b.dig_number
      if (filters.sortBy === 'highest_peak') return (b.peak_market_cap ?? 0) - (a.peak_market_cap ?? 0)
      if (filters.sortBy === 'most_holders') return (b.peak_holder_count ?? 0) - (a.peak_holder_count ?? 0)
      return b.dig_number - a.dig_number
    })

  if (filtered.length === 0) {
    return <p className="text-xs text-[#444] py-8">No digs match the current filters.</p>
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-[40px_1fr_80px_80px_70px_80px] gap-2 text-[10px] text-[#444] border-b border-[#1a1a1a] pb-2 mb-1">
        <span>#</span>
        <span>token</span>
        <span>launched</span>
        <span>cause</span>
        <span>peak</span>
        <span>holders</span>
      </div>
      {filtered.map((dig) => (
        <Link
          key={dig.id}
          href={`/digs/${dig.dig_number}`}
          className="grid grid-cols-[40px_1fr_80px_80px_70px_80px] gap-2 text-xs border-b border-[#111] py-2.5 hover:bg-[#111] transition-colors group"
        >
          <span className="text-[#d97706]">{String(dig.dig_number).padStart(3, '0')}</span>
          <span className="text-[#e8e8e8] group-hover:text-white">{dig.token_name}</span>
          <span className="text-[#555]">{formatMon(dig.launch_date)}</span>
          <span className={`${CAUSE_COLORS[dig.cause_of_death ?? 'unknown']} text-[10px]`}>
            {CAUSE_LABELS[dig.cause_of_death ?? 'unknown']}
          </span>
          <span className="text-[#888]">{formatMcap(dig.peak_market_cap)}</span>
          <span className="text-[#888]">{dig.peak_holder_count?.toLocaleString() ?? '—'}</span>
        </Link>
      ))}
    </div>
  )
}
