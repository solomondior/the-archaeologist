'use client'

import { useRouter } from 'next/navigation'

export function NominationActions({ id }: { id: string }) {
  const router = useRouter()

  async function updateStatus(status: string) {
    await fetch(`/api/admin/nominations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  return (
    <div className="flex gap-4 pt-1">
      <button
        onClick={() => updateStatus('queued')}
        className="text-[10px] text-[#d97706] hover:text-[#e8e8e8] transition-colors"
      >
        → approve
      </button>
      <button
        onClick={() => updateStatus('rejected')}
        className="text-[10px] text-[#444] hover:text-red-700 transition-colors"
      >
        → reject
      </button>
    </div>
  )
}
