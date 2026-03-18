import { createServerClient } from '@/lib/supabase/server'
import { getBurnStats } from '@/lib/burns/engine'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = createServerClient()

  const [
    { count: pendingNominations },
    { count: pendingCandidates },
    { count: totalDigs },
    { data: recentLogs },
    burnStats,
  ] = await Promise.all([
    supabase
      .from('nominations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('dig_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'candidate'),
    supabase.from('digs').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase
      .from('agent_memory')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
    getBurnStats(supabase),
  ])

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="text-[10px] text-[#d97706] tracking-widest">DASHBOARD</div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'published digs', value: totalDigs ?? 0 },
          { label: 'pending nominations', value: pendingNominations ?? 0 },
          { label: 'candidates queued', value: pendingCandidates ?? 0 },
        ].map((s) => (
          <div key={s.label} className="border border-[#1a1a1a] p-3">
            <div className="text-xl text-[#e8e8e8]">{s.value}</div>
            <div className="text-[10px] text-[#444] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="border border-[#1a1a1a] p-4">
        <div className="text-[10px] text-[#555] tracking-widest mb-3">RELIC SUPPLY</div>
        <div className="text-xs text-[#888] space-y-1">
          <div>
            current:{' '}
            <span className="text-[#e8e8e8]">{burnStats.currentSupply.toLocaleString()}</span>
          </div>
          <div>
            total burned:{' '}
            <span className="text-[#d97706]">{burnStats.totalBurned.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-[#555] tracking-widest mb-3">RECENT AGENT CYCLES</div>
        {(recentLogs ?? []).length === 0 ? (
          <p className="text-xs text-[#444]">No cycles run yet.</p>
        ) : (
          <div className="space-y-2">
            {(recentLogs ?? []).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 text-xs border-b border-[#111] pb-2"
              >
                <span className="text-[#555]">#{log.cycle_number}</span>
                <span className="text-[#888]">{log.cycle_type}</span>
                <span
                  className={`text-[10px] ${log.status === 'failed' ? 'text-red-700' : 'text-[#444]'}`}
                >
                  {log.status}
                </span>
                {log.error_message && (
                  <span className="text-[10px] text-red-700 truncate">{log.error_message}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
