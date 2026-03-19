import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SolscanLink } from '@/components/solscan-link'
import type { FossilRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

async function getData(): Promise<FossilRow[]> {
  const supabase = createServerClient()
  const { data } = await supabase.from('fossils').select('*')
  return (data ?? []) as FossilRow[]
}


function formatUsd(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(2)}`
}

function FossilEntry({
  fossil,
  index,
  highlight,
}: {
  fossil: FossilRow
  index: number
  highlight: string
}) {
  return (
    <div className="border-b border-[#111] py-3 space-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[#555] text-[10px] mr-2">
            FOSSIL #{String(index + 1).padStart(3, '0')}
          </span>
          <SolscanLink value={fossil.wallet_address} type="account" />
        </div>
        {fossil.discovered_in_dig && (
          <Link
            href={`/digs/${fossil.discovered_in_dig}`}
            className="text-[10px] text-[#333] hover:text-[#d97706] transition-colors shrink-0"
          >
            → dig
          </Link>
        )}
      </div>
      <div className="text-[10px] text-[#555] flex flex-wrap gap-3">
        <span>
          token: <span className="text-[#888]">{fossil.token_name ?? <SolscanLink value={fossil.token_address} type="account" />}</span>
        </span>
        <span>
          entered: <span className="text-[#888]">{formatUsd(fossil.entry_value_usd)}</span>
        </span>
        <span>
          current: <span className="text-[#444]">{formatUsd(fossil.current_value_usd)}</span>
        </span>
        {highlight && <span className="text-[#d97706]">{highlight}</span>}
      </div>
    </div>
  )
}

function FossilSection({
  title,
  description,
  fossils,
  highlight,
  empty,
}: {
  title: string
  description: string
  fossils: FossilRow[]
  highlight: (f: FossilRow) => string
  empty: string
}) {
  return (
    <div>
      <div className="text-[10px] text-[#d97706] tracking-widest mb-1">{title}</div>
      <p className="text-[10px] text-[#444] mb-4">{description}</p>
      {fossils.length === 0 ? (
        <p className="text-xs text-[#333]">{empty}</p>
      ) : (
        fossils.map((f, i) => (
          <FossilEntry key={f.id} fossil={f} index={i} highlight={highlight(f)} />
        ))
      )}
    </div>
  )
}

export default async function FossilsPage() {
  const fossils = await getData()

  const longestDormant = [...fossils]
    .filter((f) => f.days_dormant !== null)
    .sort((a, b) => (b.days_dormant ?? 0) - (a.days_dormant ?? 0))
    .slice(0, 10)

  const mostRugs = [...fossils]
    .filter((f) => f.consecutive_rugs !== null)
    .sort((a, b) => (b.consecutive_rugs ?? 0) - (a.consecutive_rugs ?? 0))
    .slice(0, 10)

  const largestLoss = [...fossils]
    .filter((f) => f.entry_value_usd !== null)
    .sort((a, b) => {
      const lossA = (a.entry_value_usd ?? 0) - (a.current_value_usd ?? 0)
      const lossB = (b.entry_value_usd ?? 0) - (b.current_value_usd ?? 0)
      return lossB - lossA
    })
    .slice(0, 10)

  const lastBuyers = [...fossils]
    .filter((f) => f.entry_date !== null)
    .sort((a, b) => new Date(b.entry_date!).getTime() - new Date(a.entry_date!).getTime())
    .slice(0, 10)

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <header className="mb-10">
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
        <div className="space-y-12">
          <FossilSection
            title="LONGEST DORMANT"
            description="wallets sorted by days since last transaction"
            fossils={longestDormant}
            highlight={(f) => `${f.days_dormant}d dormant`}
            empty="No dormancy data yet."
          />
          <FossilSection
            title="MOST RUGS HELD"
            description="wallets holding the highest number of distinct dead tokens"
            fossils={mostRugs}
            highlight={(f) => `${f.consecutive_rugs} rugs`}
            empty="No rug data yet."
          />
          <FossilSection
            title="LARGEST UNREALIZED LOSS"
            description="biggest bags in tokens now worth zero"
            fossils={largestLoss}
            highlight={(f) =>
              `entered ${formatUsd(f.entry_value_usd)} → ${formatUsd(f.current_value_usd)}`
            }
            empty="No loss data yet."
          />
          <FossilSection
            title="THE LAST BUYERS"
            description="the final wallets to buy each token before death"
            fossils={lastBuyers}
            highlight={(f) =>
              f.entry_date
                ? `last buy ${new Date(f.entry_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`
                : ''
            }
            empty="No last buyer data yet."
          />
        </div>
      )}

      <div className="border-t border-[#1a1a1a] mt-12 pt-6">
        <p className="text-[10px] text-[#333] italic">
          fossils are discovered when the archaeologist finds wallets still holding tokens at time of death.
        </p>
      </div>
    </main>
  )
}
