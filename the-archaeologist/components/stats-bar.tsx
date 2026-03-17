interface StatsBarProps {
  tokensExamined: number
  fossilsFound: number
  totalBurned: number
  lastDigHoursAgo: number | null
}

export function StatsBar({ tokensExamined, fossilsFound, totalBurned, lastDigHoursAgo }: StatsBarProps) {
  const lastDigLabel =
    lastDigHoursAgo === null ? 'never' : lastDigHoursAgo < 1 ? 'just now' : `${lastDigHoursAgo}h ago`

  return (
    <div className="border border-[#1a1a1a] p-3 text-xs text-[#888]">
      <span>
        tokens examined: <span className="text-[#e8e8e8]">{tokensExamined}</span>
      </span>
      <span className="mx-3 text-[#333]">|</span>
      <span>
        fossils found: <span className="text-[#e8e8e8]">{fossilsFound}</span>
      </span>
      <span className="mx-3 text-[#333]">|</span>
      <span>
        total burned: <span className="text-[#d97706]">{totalBurned.toLocaleString()} RELIC</span>
      </span>
      <span className="mx-3 text-[#333]">|</span>
      <span>
        last dig: <span className="text-[#e8e8e8]">{lastDigLabel}</span>
      </span>
    </div>
  )
}
