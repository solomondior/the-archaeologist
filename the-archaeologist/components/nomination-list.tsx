'use client'

import { useState } from 'react'
import type { NominationRow } from '@/lib/supabase/types'

interface NominationListProps {
  initialNominations: NominationRow[]
}

function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export function NominationList({ initialNominations }: NominationListProps) {
  const [nominations, setNominations] = useState(initialNominations)
  const [voting, setVoting] = useState<Set<string>>(new Set())

  async function vote(id: string) {
    if (voting.has(id)) return
    setVoting((prev) => new Set(prev).add(id))

    try {
      const res = await fetch(`/api/nominations/${id}/vote`, { method: 'POST' })
      if (res.ok) {
        setNominations((prev) =>
          prev.map((n) => (n.id === id ? { ...n, votes: n.votes + 1 } : n))
        )
      }
    } finally {
      setVoting((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (nominations.length === 0) {
    return <p className="text-xs text-[#444] py-4">No nominations yet. Be the first.</p>
  }

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-[1fr_120px_60px_80px] gap-3 text-[10px] text-[#444] border-b border-[#1a1a1a] pb-2 mb-1">
        <span>token</span>
        <span>reason</span>
        <span>votes</span>
        <span>status</span>
      </div>
      {nominations.map((n) => (
        <div
          key={n.id}
          className="grid grid-cols-[1fr_120px_60px_80px] gap-3 text-xs border-b border-[#111] py-3 items-start"
        >
          <div>
            <div className="text-[#e8e8e8]">{n.token_name ?? truncateAddress(n.token_address)}</div>
            <div className="text-[10px] text-[#444] mt-0.5">{truncateAddress(n.token_address)}</div>
            <div className="text-[10px] text-[#333] mt-0.5">{formatDate(n.submitted_at)}</div>
          </div>
          <div className="text-[10px] text-[#555] leading-relaxed">
            {n.reason ? (n.reason.length > 80 ? n.reason.slice(0, 80) + '…' : n.reason) : '—'}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => vote(n.id)}
              disabled={voting.has(n.id)}
              className="text-[10px] text-[#444] hover:text-[#d97706] transition-colors disabled:opacity-40"
              title="upvote"
            >
              ↑
            </button>
            <span className="text-[#888]">{n.votes}</span>
          </div>
          <div>
            <span
              className={`text-[10px] ${
                n.status === 'completed'
                  ? 'text-[#d97706]'
                  : n.status === 'queued'
                  ? 'text-[#888]'
                  : 'text-[#444]'
              }`}
            >
              {n.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
