import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const supabase = createServerClient()
  const { data: logs } = await supabase
    .from('agent_memory')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="max-w-3xl space-y-4">
      <div className="text-[10px] text-[#d97706] tracking-widest">AGENT LOGS</div>

      {(logs ?? []).length === 0 ? (
        <p className="text-xs text-[#444]">No cycles run yet.</p>
      ) : (
        (logs ?? []).map((log) => (
          <div key={log.id} className="border border-[#1a1a1a] p-4 space-y-2">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-[#d97706]">#{log.cycle_number}</span>
              <span className="text-[#888]">{log.cycle_type}</span>
              <span
                className={`text-[10px] ${
                  log.status === 'failed' ? 'text-red-700' : 'text-[#555]'
                }`}
              >
                {log.status}
              </span>
              <span className="text-[#333] text-[10px] ml-auto">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
            {log.memory_summary && (
              <p className="text-[10px] text-[#555] leading-relaxed">{log.memory_summary}</p>
            )}
            {log.error_message && (
              <p className="text-[10px] text-red-700">{log.error_message}</p>
            )}
            {log.tokens_covered?.length > 0 && (
              <div className="text-[10px] text-[#444]">
                tokens: {log.tokens_covered.join(', ')}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
