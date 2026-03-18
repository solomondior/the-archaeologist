import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getDataProvider } from '@/lib/data-provider'
import { scoreAllCandidates } from '@/lib/scoring/candidate-scorer'
import { ContextBuilder } from '@/lib/agent/context-builder'
import { DigGenerator } from '@/lib/agent/dig-generator'
import { ValidationLayer } from '@/lib/agent/validator'
import { MemoryManager } from '@/lib/agent/memory'
import { recordBurn } from '@/lib/burns/engine'
import { postDigTweet } from '@/lib/twitter/post'
import type { DigCandidateRow, DigRow } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const provider = getDataProvider()
  const memory = new MemoryManager(supabase)
  const cycleNumber = await memory.getNextCycleNumber()

  try {
    await scoreAllCandidates(supabase)

    const { data: candidates, error: candidateError } = await supabase
      .from('dig_candidates')
      .select('*')
      .eq('status', 'candidate')
      .order('score', { ascending: false })
      .limit(1)

    if (candidateError) throw new Error(candidateError.message)
    if (!candidates?.length) {
      return NextResponse.json({ message: 'No candidates available' })
    }

    const candidate = candidates[0] as DigCandidateRow

    const [metadata, holderHistory, priceHistory, transactions, liquidityEvents] = await Promise.all([
      provider.getTokenMetadata(candidate.token_address),
      provider.getTokenHolderHistory(candidate.token_address),
      provider.getTokenPriceHistory(candidate.token_address),
      provider.getTokenTransactions(candidate.token_address),
      provider.getLiquidityEvents(candidate.token_address),
    ])

    const devWalletActivity = await provider.getDevWalletActivity(
      metadata.creator_wallet,
      candidate.token_address
    )

    const tokenContext = {
      metadata,
      holder_history: holderHistory,
      price_history: priceHistory,
      transactions,
      dev_wallet_activity: devWalletActivity,
      liquidity_events: liquidityEvents,
    }

    const { data: lastDig } = await supabase
      .from('digs')
      .select('dig_number')
      .order('dig_number', { ascending: false })
      .limit(1)

    const digNumber = lastDig?.length ? (lastDig[0].dig_number as number) + 1 : 1

    const recentMemory = await memory.getRecentMemory(10)
    const contextBuilder = new ContextBuilder()
    const digContext = contextBuilder.buildDigContext(digNumber, tokenContext, recentMemory)

    const generator = new DigGenerator()
    const generated = await generator.generate(digContext)

    const validator = new ValidationLayer(provider)
    const validation = await validator.verify(generated)

    const { data: digData, error: insertError } = await supabase
      .from('digs')
      .insert({
        dig_number: digNumber,
        token_name: generated.token_name,
        token_address: generated.token_address,
        launch_date: generated.launch_date,
        death_date: generated.death_date,
        peak_market_cap: generated.peak_market_cap,
        peak_holder_count: generated.peak_holder_count,
        cause_of_death: generated.cause_of_death,
        content: generated.content,
        on_chain_evidence: generated.on_chain_evidence,
        raw_context: digContext as unknown as Record<string, unknown>,
        validation_status: validation.passed ? 'passed' : 'flagged',
        published: validation.passed,
        phase: 'standard',
      })
      .select()
      .single()

    if (insertError) throw new Error(insertError.message)

    await supabase.from('dig_candidates').update({ status: 'completed' }).eq('id', candidate.id)

    if (validation.passed && digData) {
      await postDigTweet(digData as DigRow)
    }

    // Fire burn events — IMPORTANT: do NOT parallelise these; each reads current supply
    // after the previous burn has been recorded (percentage-based amounts are order-sensitive)
    if (validation.passed && digData) {
      const digId = (digData as { id: string }).id

      if (generated.cause_of_death === 'rug') {
        await recordBurn(supabase, { triggerType: 'rug_confirmed', triggerReference: digId })
      }

      const { data: newFossils } = await supabase
        .from('fossils')
        .select('id')
        .eq('discovered_in_dig', digId)

      for (const fossil of newFossils ?? []) {
        await recordBurn(supabase, { triggerType: 'fossil_found', triggerReference: fossil.id })
      }

      if (digNumber % 100 === 0) {
        await recordBurn(supabase, { triggerType: 'milestone_100', triggerReference: digId })
      }
    }

    await memory.recordSuccess({
      cycleNumber,
      cycleType: 'dig',
      tokensCovered: [candidate.token_address],
      dig: digData,
    })

    return NextResponse.json({
      success: true,
      dig_number: digNumber,
      token: generated.token_name,
      validation_status: validation.passed ? 'passed' : 'flagged',
      failures: validation.failures,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await memory.recordFailure({ cycleNumber, cycleType: 'dig', errorMessage: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
