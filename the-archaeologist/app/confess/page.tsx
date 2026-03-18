import { createServerClient } from '@/lib/supabase/server'
import { ConfessionForm } from '@/components/confession-form'

export const dynamic = 'force-dynamic'

async function getCounts() {
  const supabase = createServerClient()
  const [{ count: total }, { count: referenced }] = await Promise.all([
    supabase.from('confessions').select('*', { count: 'exact', head: true }),
    supabase
      .from('confessions')
      .select('*', { count: 'exact', head: true })
      .not('used_in_dig', 'is', null),
  ])
  return { total: total ?? 0, referenced: referenced ?? 0 }
}

export default async function ConfessPage() {
  const { total, referenced } = await getCounts()

  return (
    <main className="max-w-xl mx-auto px-6 py-12">
      <header className="mb-8">
        <div className="text-[10px] text-[#d97706] tracking-widest mb-1">CONFESSION BOOTH</div>
        <p className="text-xs text-[#888]">anonymous. no wallets. no judgment.</p>
      </header>

      <div className="border-t border-[#1a1a1a] pt-6 mb-8 space-y-3">
        <p className="text-xs text-[#555] leading-relaxed">
          everyone has a story. a token they believed in, a bag they held too long,
          a dev they trusted. confessions are kept anonymous and may surface in future digs
          as testimony from the graveyard.
        </p>
        <div className="text-[10px] text-[#444]">
          <span>{total.toLocaleString()} confessions received</span>
          <span className="mx-2 text-[#333]">·</span>
          <span>{referenced.toLocaleString()} referenced in digs</span>
        </div>
      </div>

      <ConfessionForm />

      <div className="border-t border-[#1a1a1a] mt-8 pt-6">
        <p className="text-[10px] text-[#333] italic">
          your confession is not linked to any wallet or identity.
        </p>
      </div>
    </main>
  )
}
