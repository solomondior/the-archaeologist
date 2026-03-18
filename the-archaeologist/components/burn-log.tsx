interface BurnEvent {
  id: string
  trigger_type: string
  trigger_reference: string | null
  amount_burned: number
  supply_before: number
  supply_after: number
  transaction_hash: string
  burned_at: string
}

const TRIGGER_LABELS: Record<string, string> = {
  rug_confirmed: 'RUG CONFIRMED',
  fossil_found:  'FOSSIL FOUND',
  nomination:    'NOMINATION',
  series:        'SERIES',
  milestone_100: 'MILESTONE',
}

export function BurnLog({ events }: { events: BurnEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-xs text-[#444]">
        No burns yet. The first rug the agent confirms will trigger one.
      </p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-[120px_1fr_110px_80px] gap-3 text-[10px] text-[#444] border-b border-[#1a1a1a] pb-2 mb-1">
        <span>date</span>
        <span>trigger</span>
        <span>amount</span>
        <span>tx</span>
      </div>
      {[...events].reverse().map((e) => (
        <div
          key={e.id}
          className="grid grid-cols-[120px_1fr_110px_80px] gap-3 text-xs border-b border-[#111] py-2.5 items-center"
        >
          <span className="text-[#555]">
            {new Date(e.burned_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: '2-digit',
            })}
          </span>
          <span className="text-[10px] text-[#888]">
            {TRIGGER_LABELS[e.trigger_type] ?? e.trigger_type}
          </span>
          <span className="text-[#d97706]">
            {Number(e.amount_burned).toLocaleString()} RELIC
          </span>
          <span>
            {e.transaction_hash.startsWith('mock_') ? (
              <span className="text-[10px] text-[#333]">mock</span>
            ) : (
              <a
                href={`https://solscan.io/tx/${e.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#555] hover:text-[#d97706] transition-colors"
              >
                solscan ↗
              </a>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
