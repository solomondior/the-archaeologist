'use client'

import { useState } from 'react'

export function NominationForm() {
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_address: tokenAddress.trim(),
          token_name: tokenName.trim() || undefined,
          reason: reason.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }

      setStatus('done')
      setTokenAddress('')
      setTokenName('')
      setReason('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="border border-[#1a1a1a] p-4">
        <p className="text-xs text-[#888]">nomination submitted. the archaeologist will consider it.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-3 text-[10px] text-[#d97706] hover:text-[#e8e8e8] transition-colors"
        >
          → nominate another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-[10px] text-[#888] tracking-widest mb-1">TOKEN ADDRESS *</label>
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="Solana token mint address"
          required
          className="w-full bg-[#111] border border-[#222] text-xs text-[#e8e8e8] px-3 py-2 focus:outline-none focus:border-[#d97706] placeholder-[#444]"
        />
      </div>

      <div>
        <label className="block text-[10px] text-[#888] tracking-widest mb-1">TOKEN NAME</label>
        <input
          type="text"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="optional"
          maxLength={100}
          className="w-full bg-[#111] border border-[#222] text-xs text-[#e8e8e8] px-3 py-2 focus:outline-none focus:border-[#d97706] placeholder-[#444]"
        />
      </div>

      <div>
        <label className="block text-[10px] text-[#888] tracking-widest mb-1">WHY SHOULD IT BE DUG</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="what happened to this token?"
          maxLength={500}
          rows={3}
          className="w-full bg-[#111] border border-[#222] text-xs text-[#e8e8e8] px-3 py-2 focus:outline-none focus:border-[#d97706] placeholder-[#444] resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-[10px] text-red-700">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !tokenAddress.trim()}
        className="text-xs text-[#d97706] hover:text-[#e8e8e8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? '...' : '→ submit nomination'}
      </button>
    </form>
  )
}
