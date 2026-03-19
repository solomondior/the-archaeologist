import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { DigCard } from '@/components/dig-card'
import { EvidencePanel } from '@/components/evidence-panel'
import { SolscanLink } from '@/components/solscan-link'
import type { DigRow, FossilRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

interface DigPageProps {
  params: Promise<{ number: string }>
}

interface BurnEventRow {
  id: string
  trigger_type: string
  amount_burned: number
  supply_before: number
  supply_after: number
  transaction_hash: string
  burned_at: string
}

async function getDigData(digNumber: number) {
  const supabase = createServerClient()

  const { data: dig } = await supabase
    .from('digs')
    .select('*')
    .eq('dig_number', digNumber)
    .eq('published', true)
    .single()

  if (!dig) return null

  const [{ data: fossils }, { data: burnEvents }] = await Promise.all([
    supabase.from('fossils').select('*').eq('discovered_in_dig', dig.id),
    supabase
      .from('burn_events')
      .select('*')
      .eq('trigger_reference', dig.id)
      .order('burned_at'),
  ])

  return {
    dig: dig as DigRow,
    fossils: (fossils ?? []) as FossilRow[],
    burnEvents: (burnEvents ?? []) as BurnEventRow[],
  }
}

function formatUsd(n: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(2)}`
}

export default async function DigPage({ params }: DigPageProps) {
  const { number } = await params
  const digNumber = parseInt(number, 10)
  if (isNaN(digNumber)) notFound()

  const result = await getDigData(digNumber)
  if (!result) notFound()

  const { dig, fossils, burnEvents } = result

  const evidence = (dig.on_chain_evidence ?? []) as Array<{
    type: string
    hash?: string
    address?: string
    description: string
    solscan_url?: string | null
  }>

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid grid-cols-[1fr_240px] gap-12">
        <div className="space-y-10">
          <DigCard dig={dig} showLink={false} />

          {fossils.length > 0 && (
            <div>
              <div className="text-[10px] text-[#888] tracking-widest mb-4">FOSSILS FOUND</div>
              <div className="space-y-3">
                {fossils.map((f) => (
                  <div key={f.id} className="border-b border-[#111] pb-3 text-xs space-y-1">
                    <SolscanLink value={f.wallet_address} type="account" />
                    <div className="text-[10px] text-[#444] flex flex-wrap gap-3">
                      {f.days_dormant !== null && <span>{f.days_dormant}d dormant</span>}
                      {f.consecutive_rugs !== null && <span>{f.consecutive_rugs} rugs held</span>}
                      <span>entry {formatUsd(f.entry_value_usd)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {burnEvents.length > 0 && (
            <div>
              <div className="text-[10px] text-[#888] tracking-widest mb-4">BURNS TRIGGERED</div>
              <div className="space-y-2">
                {burnEvents.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs border-b border-[#111] pb-2"
                  >
                    <span className="text-[#d97706]">
                      {Number(b.amount_burned).toLocaleString()} RELIC
                    </span>
                    <span className="text-[#555] text-[10px]">
                      {b.trigger_type.replace('_', ' ')}
                    </span>
                    {b.transaction_hash.startsWith('mock_') ? (
                      <span className="text-[10px] text-[#333]">mock tx</span>
                    ) : (
                      <a
                        href={`https://solscan.io/tx/${b.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#555] hover:text-[#d97706] transition-colors"
                      >
                        solscan ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <EvidencePanel
          evidence={evidence}
          digNumber={dig.dig_number}
          tokenName={dig.token_name}
        />
      </div>
    </main>
  )
}
