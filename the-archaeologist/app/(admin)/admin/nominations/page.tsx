import { createServerClient } from '@/lib/supabase/server'
import { NominationActions } from './nomination-actions'

export const dynamic = 'force-dynamic'

export default async function NominationsAdminPage() {
  const supabase = createServerClient()
  const { data: nominations } = await supabase
    .from('nominations')
    .select('*')
    .order('votes', { ascending: false })

  return (
    <div className="max-w-3xl space-y-4">
      <div className="text-[10px] text-[#d97706] tracking-widest">NOMINATIONS</div>

      {(nominations ?? []).length === 0 && (
        <p className="text-xs text-[#444]">No nominations yet.</p>
      )}

      {(nominations ?? []).map((n) => (
        <div key={n.id} className="border border-[#1a1a1a] p-4 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-[#e8e8e8]">{n.token_name ?? n.token_address}</div>
              <div className="text-[10px] text-[#444] font-mono mt-0.5">{n.token_address}</div>
            </div>
            <div className="flex gap-3 text-[10px] shrink-0">
              <span className="text-[#888]">{n.votes} votes</span>
              <span
                className={
                  n.status === 'queued'
                    ? 'text-[#d97706]'
                    : n.status === 'rejected'
                    ? 'text-red-700'
                    : 'text-[#555]'
                }
              >
                {n.status}
              </span>
            </div>
          </div>
          {n.reason && <p className="text-[10px] text-[#555]">{n.reason}</p>}
          {n.status === 'pending' && <NominationActions id={n.id} />}
        </div>
      ))}
    </div>
  )
}
