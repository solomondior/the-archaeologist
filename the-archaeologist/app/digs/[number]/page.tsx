import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { DigCard } from '@/components/dig-card'
import { EvidencePanel } from '@/components/evidence-panel'
import type { DigRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

interface DigPageProps {
  params: Promise<{ number: string }>
}

async function getDig(digNumber: number): Promise<DigRow | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('digs')
    .select('*')
    .eq('dig_number', digNumber)
    .eq('published', true)
    .single()
  return data as DigRow | null
}

export default async function DigPage({ params }: DigPageProps) {
  const { number } = await params
  const digNumber = parseInt(number, 10)

  if (isNaN(digNumber)) notFound()

  const dig = await getDig(digNumber)
  if (!dig) notFound()

  const evidence = (dig.on_chain_evidence ?? []) as Array<{
    type: string
    hash?: string
    address?: string
    description: string
    solscan_url?: string | null
  }>

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid grid-cols-[1fr_240px] gap-12">
        <div>
          <DigCard dig={dig} showLink={false} />
        </div>
        <EvidencePanel
          evidence={evidence}
          digNumber={dig.dig_number}
          tokenName={dig.token_name}
        />
      </div>
    </main>
  )
}
