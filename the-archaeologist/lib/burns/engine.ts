import type { SupabaseClient } from '@supabase/supabase-js'
import { postBurnTweet } from '@/lib/twitter/post'

export type BurnTriggerType =
  | 'rug_confirmed'
  | 'fossil_found'
  | 'nomination'
  | 'series'
  | 'milestone_100'

const LAUNCH_SUPPLY = Number(process.env.RELIC_LAUNCH_SUPPLY ?? 500_000_000)

// Percentage-based rates (multiplied against current supply)
const BURN_RATES: Record<BurnTriggerType, number> = {
  rug_confirmed: 0.001,   // 0.1%
  fossil_found:  0.0005,  // 0.05%
  nomination:    0,       // fixed amount — see FIXED_AMOUNTS
  series:        0.0015,  // 0.15% — triggered when a recurring series dig publishes
  milestone_100: 0.005,   // 0.5%
}

const FIXED_AMOUNTS: Partial<Record<BurnTriggerType, number>> = {
  nomination: 1_000,
}

export async function getCurrentSupply(supabase: SupabaseClient): Promise<number> {
  const { data } = await supabase.from('burn_events').select('amount_burned')
  const totalBurned = (data ?? []).reduce((sum, e) => sum + Number(e.amount_burned), 0)
  return Math.max(0, LAUNCH_SUPPLY - totalBurned)
}

export async function computeBurnAmount(
  supabase: SupabaseClient,
  triggerType: BurnTriggerType
): Promise<number> {
  const fixed = FIXED_AMOUNTS[triggerType]
  if (fixed !== undefined) return fixed

  const rate = BURN_RATES[triggerType]
  if (rate === 0) return 0

  const currentSupply = await getCurrentSupply(supabase)
  return Math.floor(currentSupply * rate)
}

async function executeBurn(amount: number): Promise<string> {
  const treasuryKey = process.env.TREASURY_WALLET_PRIVATE_KEY
  if (!treasuryKey) {
    // Mock mode — writes synthetic tx hash until RELIC is deployed on Pump.fun.
    // To enable real burns: set TREASURY_WALLET_PRIVATE_KEY and implement
    // the Solana SPL burn transaction via @solana/web3.js here.
    return `mock_burn_${Date.now()}`
  }
  throw new Error(
    'Real Solana burn not yet implemented. Remove TREASURY_WALLET_PRIVATE_KEY check and add @solana/web3.js burn logic here when RELIC is deployed.'
  )
}

export async function recordBurn(
  supabase: SupabaseClient,
  opts: {
    triggerType: BurnTriggerType
    triggerReference?: string
  }
): Promise<{ id: string; amount: number; txHash: string } | null> {
  const supplyBefore = await getCurrentSupply(supabase)
  const amount = await computeBurnAmount(supabase, opts.triggerType)

  if (amount <= 0) return null

  const txHash = await executeBurn(amount)
  const supplyAfter = supplyBefore - amount

  const { data, error } = await supabase
    .from('burn_events')
    .insert({
      trigger_type: opts.triggerType,
      trigger_reference: opts.triggerReference ?? null,
      amount_burned: amount,
      supply_before: supplyBefore,
      supply_after: supplyAfter,
      transaction_hash: txHash,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to record burn: ${error.message}`)

  await postBurnTweet({ amount, triggerType: opts.triggerType, txHash, currentSupply: supplyAfter })

  return { id: data.id, amount, txHash }
}

export interface BurnStats {
  launchSupply: number
  currentSupply: number
  totalBurned: number
  burnsByType: Record<string, number>
  largestBurn: { amount: number; triggerType: string; triggerReference: string | null } | null
  burnCount: number
}

export async function getBurnStats(supabase: SupabaseClient): Promise<BurnStats> {
  const { data: events } = await supabase
    .from('burn_events')
    .select('*')
    .order('burned_at', { ascending: true })

  const rows = events ?? []
  const totalBurned = rows.reduce((sum, e) => sum + Number(e.amount_burned), 0)

  const burnsByType = rows.reduce<Record<string, number>>((acc, e) => {
    acc[e.trigger_type] = (acc[e.trigger_type] ?? 0) + Number(e.amount_burned)
    return acc
  }, {})

  const largest = rows.reduce<(typeof rows)[0] | null>(
    (max, e) => (!max || Number(e.amount_burned) > Number(max.amount_burned) ? e : max),
    null
  )

  return {
    launchSupply: LAUNCH_SUPPLY,
    currentSupply: Math.max(0, LAUNCH_SUPPLY - totalBurned),
    totalBurned,
    burnsByType,
    largestBurn: largest
      ? {
          amount: Number(largest.amount_burned),
          triggerType: largest.trigger_type,
          triggerReference: largest.trigger_reference,
        }
      : null,
    burnCount: rows.length,
  }
}

export async function getBurnHistory(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('burn_events')
    .select('*')
    .order('burned_at', { ascending: true })
  return data ?? []
}
