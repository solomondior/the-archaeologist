import type {
  TokenMetadata,
  TokenTransaction,
  WalletActivity,
  LiquidityEvent,
  HolderSnapshot,
  PriceCandle,
} from '../data-provider/types'
import type { AgentMemoryRow } from '../supabase/types'

export interface TokenContext {
  metadata: TokenMetadata
  holder_history: HolderSnapshot[]
  price_history: PriceCandle[]
  transactions: TokenTransaction[]
  dev_wallet_activity: WalletActivity
  liquidity_events: LiquidityEvent[]
}

export interface DigContext {
  dig_number: number
  tokens_already_covered: string[]
  recent_dig_summaries: string[]
  token: TokenContext
}

export interface FragmentContext {
  anomaly_type: string
  anomaly_description: string
  anomaly_data: Record<string, unknown>
  recent_fragment_contents: string[]
}

export class ContextBuilder {
  buildDigContext(
    digNumber: number,
    token: TokenContext,
    recentMemory: AgentMemoryRow[]
  ): DigContext {
    const tokensCovered = recentMemory.flatMap((m) => m.tokens_covered ?? [])
    const recentDigSummaries = recentMemory
      .filter((m) => m.cycle_type === 'dig' && m.memory_summary)
      .slice(0, 5)
      .map((m) => m.memory_summary!)

    return {
      dig_number: digNumber,
      tokens_already_covered: tokensCovered,
      recent_dig_summaries: recentDigSummaries,
      token,
    }
  }

  buildFragmentContext(
    anomalyType: string,
    anomalyDescription: string,
    anomalyData: Record<string, unknown>,
    recentFragments: string[]
  ): FragmentContext {
    return {
      anomaly_type: anomalyType,
      anomaly_description: anomalyDescription,
      anomaly_data: anomalyData,
      recent_fragment_contents: recentFragments.slice(0, 6),
    }
  }
}
