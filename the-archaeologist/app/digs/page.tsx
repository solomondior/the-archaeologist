import { createServerClient } from '@/lib/supabase/server'
import { ArchiveClient } from './archive-client'
import type { DigRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

async function getData(): Promise<DigRow[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('digs')
    .select('*')
    .eq('published', true)
    .order('dig_number', { ascending: false })
  return (data ?? []) as DigRow[]
}

export default async function ArchivePage() {
  const digs = await getData()
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-8">
        <div className="text-[10px] text-[#d97706] tracking-widest mb-1">ARCHIVE</div>
        <p className="text-xs text-[#888]">{digs.length} digs on record.</p>
      </header>
      <ArchiveClient digs={digs} />
    </main>
  )
}
