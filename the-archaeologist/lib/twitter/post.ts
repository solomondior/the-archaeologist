import { formatDigTweet, formatFragmentTweet, formatBurnTweet, postTweet } from './client'
import type { DigRow, FragmentRow } from '@/lib/supabase/types'

// All functions are non-fatal — a tweet failure must never block a publish or burn

export async function postDigTweet(dig: DigRow): Promise<void> {
  try {
    await postTweet(formatDigTweet(dig))
  } catch {
    // intentionally swallowed
  }
}

export async function postFragmentTweet(fragment: FragmentRow): Promise<void> {
  try {
    await postTweet(formatFragmentTweet(fragment))
  } catch {
    // intentionally swallowed
  }
}

export async function postBurnTweet(opts: {
  amount: number
  triggerType: string
  txHash: string
  currentSupply: number
}): Promise<void> {
  try {
    await postTweet(formatBurnTweet(opts))
  } catch {
    // intentionally swallowed
  }
}
