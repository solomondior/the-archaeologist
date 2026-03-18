import { createServerClient } from '@/lib/supabase/server'
import { NominationList } from '@/components/nomination-list'
import Link from 'next/link'
import type { NominationRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

async function getData(): Promise<NominationRow[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('nominations')
    .select('*')
    .order('votes', { ascending: false })
    .order('submitted_at', { ascending: false })
  return (data ?? []) as NominationRow[]
}

export default async function NominationsPage() {
  const nominations = await getData()

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[10px] text-[#d97706] tracking-widest mb-1">NOMINATIONS</div>
          <p className="text-xs text-[#888]">tokens the community wants excavated.</p>
        </div>
        <Link
          href="/nominate"
          className="text-xs text-[#d97706] hover:text-[#e8e8e8] transition-colors"
        >
          → nominate a token
        </Link>
      </div>

      <NominationList initialNominations={nominations} />

      <div className="border-t border-[#1a1a1a] mt-8 pt-6">
        <p className="text-[10px] text-[#333] italic">
          votes influence the candidate scoring algorithm. most-voted tokens surface faster.
        </p>
      </div>
    </main>
  )
}
