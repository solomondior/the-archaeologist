import fs from 'fs'
import path from 'path'
import type {
  DataProvider,
  TokenCandidate,
  OnChainAnomaly,
  TokenMetadata,
  HolderSnapshot,
  PriceCandle,
  TokenTransaction,
  WalletActivity,
  LiquidityEvent,
} from './types'

interface FixtureFile {
  metadata: TokenMetadata
  candidate_data: TokenCandidate
  holder_history: HolderSnapshot[]
  price_history: PriceCandle[]
  transactions: TokenTransaction[]
  dev_wallet_activity: WalletActivity
  liquidity_events: LiquidityEvent[]
  anomalies: OnChainAnomaly[]
}

function loadFixtures(): FixtureFile[] {
  const dir = path.join(process.cwd(), 'fixtures', 'tokens')
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as FixtureFile)
}

export class MockDataProvider implements DataProvider {
  private fixtures: FixtureFile[]
  private allHashes: Set<string>
  private allAddresses: Set<string>

  constructor() {
    this.fixtures = loadFixtures()
    this.allHashes = new Set([
      ...this.fixtures.flatMap((f) => f.transactions.map((t) => t.hash)),
      ...this.fixtures.flatMap((f) => f.liquidity_events.map((e) => e.hash)),
    ])
    this.allAddresses = new Set(
      this.fixtures.flatMap((f) => [
        f.metadata.address,
        f.metadata.creator_wallet,
        f.dev_wallet_activity.wallet_address,
        ...f.dev_wallet_activity.other_rugs.map((r) => r.token_address),
        ...f.transactions.map((t) => t.from_wallet),
        ...f.transactions.map((t) => t.to_wallet ?? '').filter(Boolean),
        ...f.liquidity_events.map((e) => e.wallet).filter(Boolean),
      ])
    )
  }

  private getFixture(address: string): FixtureFile {
    const fixture = this.fixtures.find((f) => f.metadata.address === address)
    if (!fixture) throw new Error(`MockDataProvider: no fixture for address ${address}`)
    return fixture
  }

  async getDeadTokenCandidates(minHolders: number, minDaysDormant: number): Promise<TokenCandidate[]> {
    return this.fixtures
      .map((f) => f.candidate_data)
      .filter((c) => c.current_holder_count >= minHolders && c.days_since_last_tx >= minDaysDormant)
  }

  async getRecentAnomalies(): Promise<OnChainAnomaly[]> {
    return this.fixtures
      .flatMap((f) => f.anomalies)
      .sort((a, b) => b.signal_strength - a.signal_strength)
      .slice(0, 5)
  }

  async getTokenMetadata(address: string): Promise<TokenMetadata> {
    return this.getFixture(address).metadata
  }

  async getTokenHolderHistory(address: string): Promise<HolderSnapshot[]> {
    return this.getFixture(address).holder_history
  }

  async getTokenPriceHistory(address: string): Promise<PriceCandle[]> {
    return this.getFixture(address).price_history
  }

  async getTokenTransactions(address: string): Promise<TokenTransaction[]> {
    return this.getFixture(address).transactions
  }

  async getDevWalletActivity(devWallet: string, tokenAddress: string): Promise<WalletActivity> {
    return this.getFixture(tokenAddress).dev_wallet_activity
  }

  async getLiquidityEvents(address: string): Promise<LiquidityEvent[]> {
    return this.getFixture(address).liquidity_events
  }

  async verifyTransactionHash(hash: string): Promise<boolean> {
    return this.allHashes.has(hash)
  }

  async verifyWalletAddress(address: string): Promise<boolean> {
    return this.allAddresses.has(address)
  }
}
