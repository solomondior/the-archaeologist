'use client'

import { useRouter } from 'next/navigation'

export function QueueActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()

  async function updateStatus(newStatus: string) {
    await fetch(`/api/admin/queue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
  }

  if (status === 'candidate') {
    return (
      <button
        onClick={() => updateStatus('skipped')}
        className="text-[10px] text-[#444] hover:text-red-700 transition-colors"
      >
        skip
      </button>
    )
  }

  if (status === 'skipped') {
    return (
      <button
        onClick={() => updateStatus('candidate')}
        className="text-[10px] text-[#444] hover:text-[#d97706] transition-colors"
      >
        requeue
      </button>
    )
  }

  return null
}
