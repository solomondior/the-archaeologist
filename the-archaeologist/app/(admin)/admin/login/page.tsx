'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Login failed')
      }
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-80 space-y-6">
        <div className="text-[10px] text-[#d97706] tracking-widest">ADMIN ACCESS</div>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
            className="w-full bg-[#111] border border-[#222] text-xs text-[#e8e8e8] px-3 py-2 focus:outline-none focus:border-[#d97706] placeholder-[#444]"
          />
          {error && <p className="text-[10px] text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="text-xs text-[#d97706] hover:text-[#e8e8e8] transition-colors disabled:opacity-40"
          >
            {loading ? '...' : '→ enter'}
          </button>
        </form>
      </div>
    </main>
  )
}
