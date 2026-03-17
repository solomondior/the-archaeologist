interface EvidenceItem {
  type: string
  hash?: string
  address?: string
  description: string
  solscan_url?: string | null
}

interface EvidencePanelProps {
  evidence: EvidenceItem[]
  digNumber: number
  tokenName: string
}

function truncate(s: string): string {
  if (s.length <= 10) return s
  return `${s.slice(0, 4)}...${s.slice(-3)}`
}

export function EvidencePanel({ evidence, digNumber, tokenName }: EvidencePanelProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const shareText = `DIG #${String(digNumber).padStart(3, '0')}: ${tokenName} — ${appUrl}/digs/${digNumber}`
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  return (
    <aside className="border-l border-[#1a1a1a] pl-6 space-y-6">
      <div>
        <div className="text-[10px] text-[#888] tracking-widest mb-3">EVIDENCE</div>
        {evidence.length === 0 ? (
          <p className="text-xs text-[#444]">No on-chain evidence cited.</p>
        ) : (
          <div className="space-y-4">
            {evidence.map((e, i) => (
              <div key={i} className="space-y-1">
                {(e.hash || e.address) && (
                  <div className="text-xs text-[#e8e8e8]">
                    {truncate(e.hash ?? e.address ?? '')}
                  </div>
                )}
                <div className="text-[10px] text-[#555]">{e.description}</div>
                {e.solscan_url ? (
                  <a
                    href={e.solscan_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#d97706] hover:text-[#e8e8e8] transition-colors"
                  >
                    solscan ↗
                  </a>
                ) : (
                  <span className="text-[10px] text-[#333]">solscan (mock)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#1a1a1a] pt-4 space-y-2">
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-[#888] hover:text-[#e8e8e8] transition-colors"
        >
          → share to X
        </a>
        <span className="block text-xs text-[#333] cursor-not-allowed">
          → nominate related token (phase 2)
        </span>
      </div>
    </aside>
  )
}
