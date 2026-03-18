'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TRIGGER_TYPES = [
  { value: 'rug_confirmed', label: 'rug confirmed' },
  { value: 'fossil_found', label: 'fossil found' },
  { value: 'series', label: 'series' },
  { value: 'milestone_100', label: 'milestone' },
]

export function ManualBurnForm() {
  const router = useRouter()
  const [triggerType, setTriggerType] = useState('rug_confirmed')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ amount: number; txHash: string } | null>(null)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/admin/burns/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger_type: triggerType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Burn failed')
      setResult(data)
      setStatus('done')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-[10px] text-[#444] mb-1">TRIGGER TYPE</label>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            className="bg-[#111] border border-[#222] text-xs text-[#888] px-2 py-1.5 focus:outline-none focus:border-[#d97706]"
          >
            {TRIGGER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="text-xs text-[#d97706] hover:text-[#e8e8e8] transition-colors pb-1.5 disabled:opacity-40"
        >
          {status === 'loading' ? '...' : '→ trigger burn'}
        </button>
      </div>
      {status === 'done' && result && (
        <p className="text-[10px] text-[#888]">
          burned <span className="text-[#d97706]">{result.amount.toLocaleString()} RELIC</span> ·{' '}
          {result.txHash.startsWith('mock_') ? 'mock tx' : result.txHash}
        </p>
      )}
      {status === 'error' && <p className="text-[10px] text-red-700">{error}</p>}
    </form>
  )
}
