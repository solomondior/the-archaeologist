import { createServerClient } from '@/lib/supabase/server'
import { DigCard } from '@/components/dig-card'
import { FragmentItem } from '@/components/fragment-item'
import { StatsBar } from '@/components/stats-bar'
import type { DigRow, FragmentRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = createServerClient()

  const [{ data: latestDig }, { data: recentFragments }, { count: digCount }, { count: fossilCount }] =
    await Promise.all([
      supabase
        .from('digs')
        .select('*')
        .eq('published', true)
        .order('dig_number', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('fragments')
        .select('*')
        .eq('published', true)
        .order('generated_at', { ascending: false })
        .limit(6),
      supabase.from('digs').select('*', { count: 'exact', head: true }).eq('published', true),
      supabase.from('fossils').select('*', { count: 'exact', head: true }),
    ])

  const lastDigHours = latestDig
    ? Math.floor((Date.now() - new Date((latestDig as DigRow).generated_at).getTime()) / 3_600_000)
    : null

  return {
    latestDig: latestDig as DigRow | null,
    recentFragments: (recentFragments ?? []) as FragmentRow[],
    tokensExamined: digCount ?? 0,
    fossilsFound: fossilCount ?? 0,
    lastDigHoursAgo: lastDigHours,
  }
}

export default async function HomePage() {
  const { latestDig, recentFragments, tokensExamined, fossilsFound, lastDigHoursAgo } = await getData()

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-sm tracking-[0.3em] text-[#d97706] mb-2">THE ARCHAEOLOGIST</h1>
        <p className="text-xs text-[#888]">digging through solana&apos;s memecoin graveyard.</p>
      </header>

      <div className="grid grid-cols-[1fr_280px] gap-12">
        <div>
          {latestDig ? (
            <DigCard dig={latestDig} showLink />
          ) : (
            <div className="border-t border-[#1a1a1a] pt-4">
              <p className="text-xs text-[#444]">
                No digs published yet. Run the dig cron to generate the first one.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-8">
          <StatsBar
            tokensExamined={tokensExamined}
            fossilsFound={fossilsFound}
            totalBurned={0}
            lastDigHoursAgo={lastDigHoursAgo}
          />

          <div>
            <div className="text-[10px] text-[#888] tracking-widest mb-4">RECENT FRAGMENTS</div>
            {recentFragments.length === 0 ? (
              <p className="text-xs text-[#444]">No fragments yet.</p>
            ) : (
              recentFragments.map((f) => <FragmentItem key={f.id} fragment={f} />)
            )}
          </div>

          <div className="border-t border-[#1a1a1a] pt-6">
            <p className="text-[10px] text-[#444] italic">every token has a last transaction.</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
