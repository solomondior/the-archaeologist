import { createServerClient } from '@/lib/supabase/server'
import { QueueActions } from './queue-actions'

export const dynamic = 'force-dynamic'

export default async function QueuePage() {
  const supabase = createServerClient()
  const { data: candidates } = await supabase
    .from('dig_candidates')
    .select('*')
    .order('score', { ascending: false })

  return (
    <div className="max-w-3xl space-y-4">
      <div className="text-[10px] text-[#d97706] tracking-widest">DIG QUEUE</div>

      <div className="grid grid-cols-[32px_1fr_70px_90px_70px] gap-3 text-[10px] text-[#444] border-b border-[#1a1a1a] pb-2">
        <span>#</span>
        <span>token</span>
        <span>score</span>
        <span>status</span>
        <span>actions</span>
      </div>

      {(candidates ?? []).map((c, i) => (
        <div
          key={c.id}
          className="grid grid-cols-[32px_1fr_70px_90px_70px] gap-3 text-xs border-b border-[#111] py-2 items-center"
        >
          <span className="text-[#555]">{i + 1}</span>
          <div>
            <div className="text-[#e8e8e8]">{c.token_name ?? '—'}</div>
            <div className="text-[10px] text-[#444] font-mono">{c.token_address.slice(0, 12)}…</div>
          </div>
          <span className="text-[#888]">{Number(c.score).toFixed(0)}</span>
          <span
            className={`text-[10px] ${
              c.status === 'completed'
                ? 'text-[#d97706]'
                : c.status === 'skipped'
                ? 'text-[#333]'
                : 'text-[#555]'
            }`}
          >
            {c.status}
          </span>
          <QueueActions id={c.id} status={c.status} />
        </div>
      ))}
    </div>
  )
}
