import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { FossilRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

async function getData(): Promise<FossilRow[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('fossils')
    .select('*')
    .order('consecutive_rugs', { ascending: false })
    .order('days_dormant', { ascending: false })
  return (data ?? []) as FossilRow[]
}

function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatUsd(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(2)}`
}

export default async function FossilsPage() {
  const fossils = await getData()

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-8">
        <div className="text-[10px] text-[#d97706] tracking-widest mb-1">WALL OF FOSSILS</div>
        <p className="text-xs text-[#888]">wallets still holding. eternal holders. the faithful.</p>
      </header>

      {fossils.length === 0 ? (
        <div className="border-t border-[#1a1a1a] pt-6">
          <p className="text-xs text-[#444]">
            No fossils catalogued yet. They are discovered during digs.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_120px_80px_80px_60px_60px] gap-3 text-[10px] text-[#444] border-b border-[#1a1a1a] pb-2 mb-1">
            <span>wallet</span>
            <span>token</span>
            <span>entry value</span>
            <span>current</span>
            <span>dormant</span>
            <span>rugs</span>
          </div>
          {fossils.map((f) => (
            <div
              key={f.id}
              className="grid grid-cols-[1fr_120px_80px_80px_60px_60px] gap-3 text-xs border-b border-[#111] py-3 items-start"
            >
              <div>
                <span className="text-[#555] font-mono">{truncateAddress(f.wallet_address)}</span>
                {f.discovered_in_dig && (
                  <Link
                    href={`/digs/${f.discovered_in_dig}`}
                    className="block text-[10px] text-[#333] hover:text-[#d97706] transition-colors mt-0.5"
                  >
                    → dig
                  </Link>
                )}
              </div>
              <div>
                <div className="text-[#e8e8e8]">{f.token_name ?? '—'}</div>
                <div className="text-[10px] text-[#444] mt-0.5 font-mono">
                  {truncateAddress(f.token_address)}
                </div>
              </div>
              <span className="text-[#888]">{formatUsd(f.entry_value_usd)}</span>
              <span className={`${(f.current_value_usd ?? 0) < 1 ? 'text-[#444]' : 'text-[#888]'}`}>
                {formatUsd(f.current_value_usd)}
              </span>
              <span className="text-[#555]">{f.days_dormant ?? '—'}d</span>
              <span className={`${(f.consecutive_rugs ?? 0) >= 3 ? 'text-red-700' : 'text-[#555]'}`}>
                {f.consecutive_rugs ?? '—'}
              </span>
            </div>
          ))}
        </>
      )}

      <div className="border-t border-[#1a1a1a] mt-8 pt-6">
        <p className="text-[10px] text-[#333] italic">
          fossils are discovered when the archaeologist finds wallets still holding tokens at time of death.
        </p>
      </div>
    </main>
  )
}
