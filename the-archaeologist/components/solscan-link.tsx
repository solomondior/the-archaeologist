'use client'

interface SolscanLinkProps {
  value: string
  type: 'account' | 'tx'
}

function truncate(s: string): string {
  if (s.length <= 12) return s
  return `${s.slice(0, 6)}...${s.slice(-4)}`
}

export function SolscanLink({ value, type }: SolscanLinkProps) {
  const href = `https://solscan.io/${type}/${value}`

  return (
    <span className="relative group inline-block">
      <span className="font-mono text-[#e8e8e8] cursor-default">
        {truncate(value)}
      </span>

      {/* Tooltip */}
      <span className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
        pointer-events-none group-hover:pointer-events-auto
        opacity-0 group-hover:opacity-100
        transition-opacity duration-150
        z-50
      ">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex items-center gap-1.5 whitespace-nowrap
            bg-[#0f0f0f] border border-[#2a2a2a]
            text-[10px] text-[#d97706] hover:text-[#f0f0f0]
            px-2.5 py-1.5 rounded
            transition-colors duration-100
          "
        >
          view on solscan ↗
          <span className="text-[#444] font-mono text-[9px] max-w-[120px] truncate">{value}</span>
        </a>
        {/* Arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2a2a2a]" />
      </span>
    </span>
  )
}
