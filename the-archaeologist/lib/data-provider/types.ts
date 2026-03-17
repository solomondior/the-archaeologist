// ─── Token Metadata ───────────────────────────────────────────────────────────

export interface TokenMetadata {
  address: string
  name: string
  symbol: string
  decimals: number
  launch_date: string           // ISO 8601
  creator_wallet: string
  current_supply: number
  description?: string
}

// ─── Holder Snapshots ─────────────────────────────────────────────────────────

export interface HolderSnapshot {
  date: string                  // ISO 8601
  holder_count: number
  top_holders: Array<{
    wallet: string
    balance: number
    percentage: number
  }>
}

// ─── Price History ────────────────────────────────────────────────────────────

export interface PriceCandle {
  timestamp: string             // ISO 8601
  open: number
  high: number
  low: number
  close: number
  volume: number
  market_cap: number
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TransactionType = 'buy' | 'sell' | 'transfer' | 'mint' | 'burn' | 'liquidity_add' | 'liquidity_remove'

export interface TokenTransaction {
  hash: string
  block_number: number
  timestamp: string             // ISO 8601
  type: TransactionType
  from_wallet: string
  to_wallet?: string
  amount: number
  value_usd: number
  is_dev_wallet: boolean
}

// ─── Wallet Activity ──────────────────────────────────────────────────────────

export interface WalletActivity {
  wallet: string
  first_transaction: string     // ISO 8601
  last_transaction: string      // ISO 8601
  total_transactions: number
  inflows: TokenTransaction[]
  outflows: TokenTransaction[]
  net_position_usd: number
}

// ─── Liquidity Events ─────────────────────────────────────────────────────────

export interface LiquidityEvent {
  hash: string
  timestamp: string             // ISO 8601
  type: 'add' | 'remove'
  wallet: string
  amount_usd: number
  is_dev_wallet: boolean
}

// ─── Candidates ───────────────────────────────────────────────────────────────

export interface TokenCandidate {
  address: string
  name: string
  name_raw: string
  peak_market_cap: number
  peak_holder_count: number
  current_holder_count: number
  last_transaction_date: string // ISO 8601
  days_since_last_tx: number
  rug_confirmed: boolean
  unusual_patterns: boolean
  cause_of_death?: 'rug' | 'abandonment' | 'whale_exit' | 'natural_decay' | 'unknown'
}

// ─── Anomalies (for fragments) ────────────────────────────────────────────────

export type AnomalyType = 'dormancy' | 'rug_pattern' | 'consecutive_losses' | 'last_buyer' | 'other'

export interface OnChainAnomaly {
  type: AnomalyType
  signal_strength: number       // 0–100
  token_address?: string
  token_name?: string
  wallet_address?: string
  description: string
  data: Record<string, unknown> // raw supporting data
}

// ─── DataProvider Interface ───────────────────────────────────────────────────

export interface DataProvider {
  // Discovery
  getDeadTokenCandidates(minHolders: number, minDaysDormant: number): Promise<TokenCandidate[]>
  getRecentAnomalies(): Promise<OnChainAnomaly[]>

  // Per-dig fetch
  getTokenMetadata(address: string): Promise<TokenMetadata>
  getTokenHolderHistory(address: string): Promise<HolderSnapshot[]>
  getTokenPriceHistory(address: string): Promise<PriceCandle[]>
  getTokenTransactions(address: string): Promise<TokenTransaction[]>
  getDevWalletActivity(devWallet: string, tokenAddress: string): Promise<WalletActivity>
  getLiquidityEvents(address: string): Promise<LiquidityEvent[]>

  // Validation
  verifyTransactionHash(hash: string): Promise<boolean>
  verifyWalletAddress(address: string): Promise<boolean>
}

// ─── Generated Dig ────────────────────────────────────────────────────────────

export type CauseOfDeath = 'rug' | 'abandonment' | 'whale_exit' | 'natural_decay' | 'unknown'

export interface EvidenceItem {
  type: string
  hash?: string
  address?: string
  description: string
  solscan_url?: string
}

export interface GeneratedDig {
  token_name: string
  token_address: string
  launch_date: string
  death_date: string
  peak_market_cap: number
  peak_holder_count: number
  cause_of_death: CauseOfDeath
  content: {
    what_it_was: string
    what_happened: string
    what_remains: string
    archaeologist_thinks: string
  }
  on_chain_evidence: EvidenceItem[]
}
