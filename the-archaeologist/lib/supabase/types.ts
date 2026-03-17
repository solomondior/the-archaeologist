export interface DigRow {
  id: string
  dig_number: number
  token_name: string
  token_address: string | null
  launch_date: string | null
  death_date: string | null
  peak_market_cap: number | null
  peak_holder_count: number | null
  cause_of_death: string | null
  content: {
    what_it_was: string
    what_happened: string
    what_remains: string
    archaeologist_thinks: string
  }
  on_chain_evidence: Array<{
    type: string
    hash?: string
    address?: string
    description: string
    solscan_url?: string
  }> | null
  raw_context: Record<string, unknown> | null
  validation_status: 'pending' | 'passed' | 'flagged'
  generated_at: string
  phase: string
  published: boolean
}

export interface FragmentRow {
  id: string
  content: string
  source_wallet: string | null
  source_token: string | null
  anomaly_type: string | null
  generated_at: string
  published: boolean
}

export interface DigCandidateRow {
  id: string
  token_address: string
  token_name: string | null
  token_name_raw: string | null
  score: number
  score_breakdown: Record<string, number> | null
  status: 'candidate' | 'queued' | 'completed' | 'skipped'
  added_at: string
}

export interface AgentMemoryRow {
  id: string
  cycle_number: number
  cycle_type: 'dig' | 'fragment'
  tokens_covered: string[] | null
  memory_summary: string | null
  status: 'completed' | 'failed' | 'flagged'
  error_message: string | null
  created_at: string
}
