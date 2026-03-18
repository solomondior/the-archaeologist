interface BurnPoint {
  burned_at: string
  supply_after: number
}

interface SupplyChartProps {
  launchSupply: number
  events: BurnPoint[]
}

export function SupplyChart({ launchSupply, events }: SupplyChartProps) {
  if (events.length === 0) {
    return (
      <div className="border border-[#1a1a1a] p-4 text-center">
        <p className="text-xs text-[#333]">supply unchanged — no burns yet</p>
      </div>
    )
  }

  const W = 600
  const H = 120
  const PAD = { top: 10, right: 20, bottom: 20, left: 64 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const allSupplies = [launchSupply, ...events.map((e) => e.supply_after)]
  const minSupply = Math.min(...allSupplies)
  const supplyRange = launchSupply - minSupply || 1
  const totalPoints = events.length + 1

  // First point: before any burns
  const points: { x: number; y: number }[] = [{ x: 0, y: 0 }]

  events.forEach((e, i) => {
    const xFrac = (i + 1) / (totalPoints - 1)
    const yFrac = 1 - (e.supply_after - minSupply) / supplyRange
    points.push({ x: xFrac * chartW, y: yFrac * chartH })
  })

  const polyline = points
    .map((p) => `${PAD.left + p.x},${PAD.top + p.y}`)
    .join(' ')

  function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return String(n)
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="#1a1a1a" strokeWidth={1} />
      <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="#1a1a1a" strokeWidth={1} />

      {/* Y-axis labels */}
      <text x={PAD.left - 4} y={PAD.top + 4} textAnchor="end" fontSize={9} fill="#444">
        {fmt(launchSupply)}
      </text>
      <text x={PAD.left - 4} y={PAD.top + chartH} textAnchor="end" fontSize={9} fill="#444">
        {fmt(minSupply)}
      </text>

      {/* Supply line */}
      <polyline points={polyline} fill="none" stroke="#d97706" strokeWidth={1.5} />

      {/* Burn event dots */}
      {points.slice(1).map((p, i) => (
        <circle
          key={i}
          cx={PAD.left + p.x}
          cy={PAD.top + p.y}
          r={3}
          fill="#d97706"
        />
      ))}
    </svg>
  )
}
