'use client'

import { useState } from 'react'

export function ConfessionForm() {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }

      setStatus('done')
      setContent('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="border border-[#1a1a1a] p-4">
        <p className="text-xs text-[#888]">confession received. it will be kept anonymous.</p>
        <p className="text-[10px] text-[#444] mt-1">the archaeologist may reference it in a future dig.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-3 text-[10px] text-[#d97706] hover:text-[#e8e8e8] transition-colors"
        >
          → confess again
        </button>
      </div>
    )
  }

  const remaining = 1000 - content.length

  return (
    <form onSubmit={submit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="i bought at the top. i believed the roadmap. i held through zero."
        required
        minLength={10}
        maxLength={1000}
        rows={6}
        className="w-full bg-[#111] border border-[#222] text-xs text-[#888] px-3 py-2 focus:outline-none focus:border-[#d97706] placeholder-[#333] resize-none leading-relaxed"
      />

      <div className="flex items-center justify-between">
        <span className={`text-[10px] ${remaining < 100 ? 'text-[#d97706]' : 'text-[#333]'}`}>
          {remaining} remaining
        </span>
        {status === 'error' && (
          <span className="text-[10px] text-red-700">{errorMsg}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={status === 'loading' || content.trim().length < 10}
        className="text-xs text-[#d97706] hover:text-[#e8e8e8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? '...' : '→ submit anonymously'}
      </button>
    </form>
  )
}
