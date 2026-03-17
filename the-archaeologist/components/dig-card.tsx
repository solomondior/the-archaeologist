import Link from 'next/link'
import type { DigRow } from '@/lib/supabase/types'

interface DigCardProps {
  dig: DigRow
  showLink?: boolean
}

const CAUSE_LABELS: Record<string, string> = {
  rug: 'RUG',
  abandonment: 'ABANDONMENT',
  whale_exit: 'WHALE EXIT',
  natural_decay: 'NATURAL DECAY',
  unknown: 'UNKNOWN',
}

const CAUSE_COLORS: Record<string, string> = {
  rug: 'text-red-600',
  abandonment: 'text-[#888]',
  whale_exit: 'text-[#d97706]',
  natural_decay: 'text-[#888]',
  unknown: 'text-[#444]',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatMcap(n: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export function DigCard({ dig, showLink = true }: DigCardProps) {
  const content = dig.content

  return (
    <article className="border-t border-[#d97706] pt-4">
      <div className="mb-4">
        <div className="text-[10px] text-[#d97706] tracking-widest mb-1">
          DIG #{String(dig.dig_number).padStart(3, '0')}
        </div>
        <h2 className="text-xl text-[#e8e8e8] tracking-wide mb-1">{dig.token_name}</h2>
        <div className="text-xs text-[#888]">
          {formatDate(dig.launch_date)} → {formatDate(dig.death_date)}
          <span className="mx-2 text-[#333]">·</span>
          peak {formatMcap(dig.peak_market_cap)}
          <span className="mx-2 text-[#333]">·</span>
          <span className={CAUSE_COLORS[dig.cause_of_death ?? 'unknown']}>
            {CAUSE_LABELS[dig.cause_of_death ?? 'unknown']}
          </span>
        </div>
      </div>

      <div className="space-y-4 text-sm text-[#888] leading-relaxed">
        {content.what_it_was && (
          <div>
            <div className="text-[10px] text-[#d97706] tracking-widest mb-1">WHAT IT WAS</div>
            <p>{content.what_it_was}</p>
          </div>
        )}
        {content.what_happened && (
          <div>
            <div className="text-[10px] text-[#d97706] tracking-widest mb-1">WHAT HAPPENED</div>
            <p>{content.what_happened}</p>
          </div>
        )}
        {content.what_remains && (
          <div>
            <div className="text-[10px] text-[#d97706] tracking-widest mb-1">WHAT REMAINS</div>
            <p>{content.what_remains}</p>
          </div>
        )}
        {content.archaeologist_thinks && (
          <div>
            <div className="text-[10px] text-[#d97706] tracking-widest mb-1">
              WHAT THE ARCHAEOLOGIST THINKS
            </div>
            <p>{content.archaeologist_thinks}</p>
          </div>
        )}
      </div>

      {showLink && (
        <div className="mt-4 text-xs">
          <Link
            href={`/digs/${dig.dig_number}`}
            className="text-[#d97706] hover:text-[#e8e8e8] transition-colors"
          >
            → read full dig
          </Link>
        </div>
      )}
    </article>
  )
}
