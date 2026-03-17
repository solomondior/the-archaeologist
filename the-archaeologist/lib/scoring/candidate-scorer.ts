import type { TokenCandidate } from '../data-provider/types'
import type { DigCandidateRow } from '../supabase/types'
import { createServerClient } from '../supabase/server'

export interface ScoreBreakdown {
  market_cap_score: number
  holder_score: number
  dormancy_score: number
  nomination_score: number
  rug_bonus: number
  pattern_bonus: number
  confession_bonus: number
  peak_market_cap: number
  peak_holder_count: number
  days_since_last_tx: number
  rug_confirmed: boolean
  unusual_patterns: boolean
}

export interface ScoredCandidate {
  score: number
  breakdown: ScoreBreakdown
}

export function scoreCandidate(
  candidate: TokenCandidate,
  nomination_votes = 0,
  confession_mentions = 0
): ScoredCandidate {
  const market_cap_score = candidate.peak_market_cap > 0 ? Math.log10(candidate.peak_market_cap) * 20 : 0
  const holder_score = candidate.peak_holder_count * 0.01
  const dormancy_score = candidate.days_since_last_tx * 0.5
  const nomination_score = nomination_votes * 5
  const rug_bonus = candidate.rug_confirmed ? 30 : 0
  const pattern_bonus = candidate.unusual_patterns ? 20 : 0
  const confession_bonus = confession_mentions * 10

  const score =
    market_cap_score +
    holder_score +
    dormancy_score +
    nomination_score +
    rug_bonus +
    pattern_bonus +
    confession_bonus

  return {
    score,
    breakdown: {
      market_cap_score,
      holder_score,
      dormancy_score,
      nomination_score,
      rug_bonus,
      pattern_bonus,
      confession_bonus,
      peak_market_cap: candidate.peak_market_cap,
      peak_holder_count: candidate.peak_holder_count,
      days_since_last_tx: candidate.days_since_last_tx,
      rug_confirmed: candidate.rug_confirmed,
      unusual_patterns: candidate.unusual_patterns,
    },
  }
}

export async function scoreAllCandidates(
  supabase: ReturnType<typeof createServerClient>
): Promise<void> {
  const { data: candidates, error } = await supabase
    .from('dig_candidates')
    .select('*')
    .eq('status', 'candidate')

  if (error) throw new Error(`Failed to fetch candidates: ${error.message}`)
  if (!candidates?.length) return

  for (const row of candidates as DigCandidateRow[]) {
    const bd = row.score_breakdown ?? {}
    const candidate: TokenCandidate = {
      address: row.token_address,
      name: row.token_name ?? '',
      name_raw: row.token_name_raw ?? '',
      peak_market_cap: (bd.peak_market_cap as number) ?? 0,
      peak_holder_count: (bd.peak_holder_count as number) ?? 0,
      current_holder_count: 0,
      last_transaction_date: new Date().toISOString(),
      days_since_last_tx: (bd.days_since_last_tx as number) ?? 0,
      rug_confirmed: Boolean(bd.rug_confirmed),
      unusual_patterns: Boolean(bd.unusual_patterns),
    }

    const { score, breakdown } = scoreCandidate(candidate)

    await supabase
      .from('dig_candidates')
      .update({ score, score_breakdown: breakdown })
      .eq('id', row.id)
  }
}
