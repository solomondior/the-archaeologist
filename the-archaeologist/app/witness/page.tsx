import { createServerClient } from '@/lib/supabase/server'
import { BurnLog } from '@/components/burn-log'
import { SupplyChart } from '@/components/supply-chart'
import { getBurnStats, getBurnHistory } from '@/lib/burns/engine'

export const dynamic = 'force-dynamic'

const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET ?? null

export default async function WitnessPage() {
  const supabase = createServerClient()
  const [stats, history] = await Promise.all([
    getBurnStats(supabase),
    getBurnHistory(supabase),
  ])

  const burnPct =
    stats.launchSupply > 0
      ? ((stats.totalBurned / stats.launchSupply) * 100).toFixed(3)
      : '0.000'

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <header className="mb-10">
        <div className="text-[10px] text-[#d97706] tracking-widest mb-1">WITNESS</div>
        <p className="text-xs text-[#888]">the ledger. every burn. every token destroyed.</p>
      </header>

      {TREASURY_WALLET && (
        <div className="border border-[#1a1a1a] p-4 mb-10">
          <div className="text-[10px] text-[#555] tracking-widest mb-2">TREASURY WALLET</div>
          <a
            href={`https://solscan.io/account/${TREASURY_WALLET}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[#888] hover:text-[#d97706] transition-colors break-all"
          >
            {TREASURY_WALLET}
          </a>
        </div>
      )}

      {/* Supply stats */}
      <div className="border border-[#1a1a1a] p-4 mb-10">
        <div className="text-[10px] text-[#555] tracking-widest mb-4">SUPPLY</div>
        <div className="grid grid-cols-[1fr_1fr] gap-y-2 gap-x-8 text-xs text-[#888]">
          <span>total supply at launch</span>
          <span className="text-[#e8e8e8]">{stats.launchSupply.toLocaleString()} RELIC</span>

          <span>total burned</span>
          <span className="text-[#d97706]">
            {stats.totalBurned.toLocaleString()} RELIC ({burnPct}%)
          </span>

          <span>current supply</span>
          <span className="text-[#e8e8e8]">{stats.currentSupply.toLocaleString()} RELIC</span>

          <span>burn events</span>
          <span className="text-[#e8e8e8]">{stats.burnCount.toLocaleString()}</span>

          {stats.largestBurn && (
            <>
              <span>largest single burn</span>
              <span className="text-[#d97706]">
                {stats.largestBurn.amount.toLocaleString()} RELIC (
                {stats.largestBurn.triggerType.replace(/_/g, ' ')})
              </span>
            </>
          )}

          <span>burned by rugs</span>
          <span className="text-[#e8e8e8]">
            {(stats.burnsByType['rug_confirmed'] ?? 0).toLocaleString()} RELIC
          </span>

          <span>burned by fossils</span>
          <span className="text-[#e8e8e8]">
            {(stats.burnsByType['fossil_found'] ?? 0).toLocaleString()} RELIC
          </span>
        </div>
      </div>

      {/* Depletion bar */}
      <div className="mb-10">
        <div className="text-[10px] text-[#555] tracking-widest mb-3">SUPPLY DEPLETION</div>
        <div className="w-full bg-[#111] border border-[#1a1a1a] h-2 relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[#d97706]"
            style={{ width: `${burnPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#333] mt-1">
          <span>0</span>
          <span>{burnPct}% burned</span>
          <span>{stats.launchSupply.toLocaleString()}</span>
        </div>
      </div>

      {/* Supply chart */}
      <div className="mb-10">
        <div className="text-[10px] text-[#555] tracking-widest mb-3">SUPPLY OVER TIME</div>
        <SupplyChart
          launchSupply={stats.launchSupply}
          events={history.map((e) => ({
            burned_at: e.burned_at as string,
            supply_after: Number(e.supply_after),
          }))}
        />
      </div>

      {/* Burn log */}
      <div>
        <div className="text-[10px] text-[#555] tracking-widest mb-4">BURN HISTORY</div>
        <BurnLog
          events={history as Array<{
            id: string
            trigger_type: string
            trigger_reference: string | null
            amount_burned: number
            supply_before: number
            supply_after: number
            transaction_hash: string
            burned_at: string
          }>}
        />
      </div>

      <div className="border-t border-[#1a1a1a] mt-10 pt-6">
        <p className="text-[10px] text-[#333] italic">
          every burn fires a solana transaction. every transaction is public. the graveyard fuels the fire.
        </p>
      </div>
    </main>
  )
}
