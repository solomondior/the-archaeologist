import { createServerClient } from '@/lib/supabase/server'
import { FragmentItem } from '@/components/fragment-item'
import type { FragmentRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

async function getData(): Promise<FragmentRow[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('fragments')
    .select('*')
    .eq('published', true)
    .order('generated_at', { ascending: false })
    .limit(50)
  return (data ?? []) as FragmentRow[]
}

export default async function FragmentsPage() {
  const fragments = await getData()

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <header className="mb-8">
        <div className="text-[10px] text-[#d97706] tracking-widest mb-1">FRAGMENTS</div>
        <p className="text-xs text-[#888]">dispatches from the graveyard.</p>
      </header>

      {fragments.length === 0 ? (
        <p className="text-xs text-[#444]">No fragments yet.</p>
      ) : (
        <div className="space-y-1">
          {fragments.map((f) => (
            <FragmentItem key={f.id} fragment={f} />
          ))}
        </div>
      )}

      <div className="border-t border-[#1a1a1a] mt-8 pt-6">
        <p className="text-[10px] text-[#333] italic">
          fragments are generated every 6 hours from anomalous on-chain activity.
        </p>
      </div>
    </main>
  )
}
