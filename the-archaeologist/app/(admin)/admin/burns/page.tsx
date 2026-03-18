import { createServerClient } from '@/lib/supabase/server'
import { getBurnHistory, getBurnStats } from '@/lib/burns/engine'
import { BurnLog } from '@/components/burn-log'
import { ManualBurnForm } from './manual-burn-form'

export const dynamic = 'force-dynamic'

export default async function BurnsAdminPage() {
  const supabase = createServerClient()
  const [history, stats] = await Promise.all([
    getBurnHistory(supabase),
    getBurnStats(supabase),
  ])

  return (
    <div className="max-w-3xl space-y-8">
      <div className="text-[10px] text-[#d97706] tracking-widest">BURNS</div>

      <div className="border border-[#1a1a1a] p-4 text-xs text-[#888] space-y-1">
        <div>
          current supply:{' '}
          <span className="text-[#e8e8e8]">{stats.currentSupply.toLocaleString()} RELIC</span>
        </div>
        <div>
          total burned:{' '}
          <span className="text-[#d97706]">{stats.totalBurned.toLocaleString()} RELIC</span>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-[#555] tracking-widest mb-4">MANUAL TRIGGER</div>
        <ManualBurnForm />
      </div>

      <div>
        <div className="text-[10px] text-[#555] tracking-widest mb-4">HISTORY</div>
        <BurnLog events={history as Parameters<typeof BurnLog>[0]['events']} />
      </div>
    </div>
  )
}
