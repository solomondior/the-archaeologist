import { SolscanLink } from '@/components/solscan-link'

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
                {e.hash && (
                  <div className="text-xs">
                    <SolscanLink value={e.hash} type="tx" />
                  </div>
                )}
                {e.address && !e.hash && (
                  <div className="text-xs">
                    <SolscanLink value={e.address} type="account" />
                  </div>
                )}
                <div className="text-[10px] text-[#555]">{e.description}</div>
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
        <a
          href="/nominate"
          className="block text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          → nominate a related token
        </a>
        <a
          href="/confess"
          className="block text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          → confession booth
        </a>
      </div>
    </aside>
  )
}
