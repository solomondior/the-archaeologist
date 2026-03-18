import Link from 'next/link'
import type { NominationRow } from '@/lib/supabase/types'

export function NominationLeaderboard({ nominations }: { nominations: NominationRow[] }) {
  if (nominations.length === 0) return null

  return (
    <div>
      <div className="text-[10px] text-[#888] tracking-widest mb-3">TOP NOMINATIONS</div>
      <div className="space-y-2">
        {nominations.map((n, i) => (
          <div key={n.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[#333] shrink-0">{i + 1}.</span>
              <span className="text-[#888] truncate">
                {n.token_name ?? n.token_address.slice(0, 8) + '…'}
              </span>
            </div>
            <span className="text-[#d97706] shrink-0 ml-2">{n.votes}↑</span>
          </div>
        ))}
      </div>
      <Link
        href="/nominations"
        className="block text-[10px] text-[#444] hover:text-[#888] transition-colors mt-3"
      >
        → all nominations
      </Link>
    </div>
  )
}
