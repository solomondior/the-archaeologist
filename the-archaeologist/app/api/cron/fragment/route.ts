import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getDataProvider } from '@/lib/data-provider'
import { ContextBuilder } from '@/lib/agent/context-builder'
import { FragmentGenerator } from '@/lib/agent/fragment-generator'
import { MemoryManager } from '@/lib/agent/memory'
import type { FragmentRow } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const provider = getDataProvider()
  const memory = new MemoryManager(supabase)
  const cycleNumber = await memory.getNextCycleNumber()

  try {
    const anomalies = await provider.getRecentAnomalies()
    if (!anomalies.length) {
      return NextResponse.json({ message: 'No anomalies available' })
    }

    const anomaly = [...anomalies].sort((a, b) => b.signal_strength - a.signal_strength)[0]

    const { data: recentFragments } = await supabase
      .from('fragments')
      .select('content')
      .eq('published', true)
      .order('generated_at', { ascending: false })
      .limit(6)

    const recentContents = ((recentFragments ?? []) as Pick<FragmentRow, 'content'>[]).map(
      (f) => f.content
    )

    const contextBuilder = new ContextBuilder()
    const fragmentContext = contextBuilder.buildFragmentContext(
      anomaly.type,
      anomaly.description,
      anomaly.data,
      recentContents
    )

    const generator = new FragmentGenerator()
    const content = await generator.generate(fragmentContext)

    await supabase.from('fragments').insert({
      content,
      source_token: anomaly.token_address ?? null,
      source_wallet: anomaly.wallet_address ?? null,
      anomaly_type: anomaly.type,
      published: true,
    })

    await memory.recordSuccess({
      cycleNumber,
      cycleType: 'fragment',
      tokensCovered: anomaly.token_address ? [anomaly.token_address] : [],
    })

    return NextResponse.json({ success: true, content })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await memory.recordFailure({ cycleNumber, cycleType: 'fragment', errorMessage: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
