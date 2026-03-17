# The Archaeologist — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core engine of The Archaeologist — Next.js app with Supabase, mock on-chain data pipeline, Claude-powered dig/fragment generation cycle, and public frontend (homepage, archive, dig page, fragments).

**Architecture:** Adapter pattern — all agent logic calls a `DataProvider` interface. `MockDataProvider` backed by fixture JSON runs with no API keys. Vercel Cron triggers dig cycle (24h) and fragment cycle (6h). Every dig is validated before publishing.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL), Anthropic SDK (claude-sonnet-4-6), Zod, Geist Mono font, Vercel.

---

## File Map

```
the-archaeologist/
├── app/
│   ├── layout.tsx                        # Root layout — Geist Mono, dark theme
│   ├── page.tsx                          # Homepage — two-column, latest dig + sidebar
│   ├── digs/
│   │   ├── page.tsx                      # Archive — sidebar filters + table
│   │   └── [number]/page.tsx             # Individual dig — content + evidence panel
│   ├── fragments/page.tsx                # Fragment feed — last 50
│   └── api/
│       ├── cron/dig/route.ts             # POST — 24h dig cycle
│       ├── cron/fragment/route.ts        # POST — 6h fragment cycle
│       └── health/route.ts              # GET — health check
├── lib/
│   ├── data-provider/
│   │   ├── types.ts                      # DataProvider interface + all shared types
│   │   ├── mock.ts                       # MockDataProvider (fixture-backed)
│   │   └── index.ts                      # Factory: returns mock or live provider
│   ├── agent/
│   │   ├── context-builder.ts            # Assembles Claude context payload
│   │   ├── dig-generator.ts              # Calls Claude, returns GeneratedDig
│   │   ├── fragment-generator.ts         # Calls Claude, returns Fragment
│   │   ├── validator.ts                  # Verifies tx hashes/addresses before publish
│   │   └── memory.ts                     # Compresses + stores agent_memory rows
│   ├── scoring/
│   │   └── candidate-scorer.ts           # PRD scoring formula, writes to dig_candidates
│   └── supabase/
│       ├── client.ts                     # Typed browser client (anon key)
│       ├── server.ts                     # Typed server client (service role)
│       └── types.ts                      # Hand-written DB types (replaces generated)
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql        # All 8 tables
│       └── 002_rls_policies.sql          # RLS for all tables
├── fixtures/
│   └── tokens/
│       ├── copetoken.json
│       ├── moonrat.json
│       ├── harold.json
│       ├── dustbunny.json
│       ├── wizardhat.json
│       ├── solghost.json
│       ├── pepehands.json
│       ├── vaporcat.json
│       ├── rugmaster.json
│       └── finalform.json
├── scripts/
│   └── seed-candidates.ts               # npm run seed — loads fixtures into dig_candidates
├── components/
│   ├── dig-card.tsx                      # Full dig content renderer
│   ├── fragment-item.tsx                 # Single fragment row
│   ├── stats-bar.tsx                     # Live stats display
│   ├── archive-table.tsx                 # Filtered table of all digs
│   ├── filter-sidebar.tsx                # Filter controls for archive
│   └── evidence-panel.tsx               # Right panel on dig page
├── vercel.json                           # Cron schedule
├── .env.local                            # Local env vars (not committed)
└── .env.example                          # Committed template
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `the-archaeologist/` (project root, all subsequent paths relative to this)
- Create: `app/layout.tsx`
- Create: `tailwind.config.ts`
- Create: `.env.example`
- Create: `vercel.json`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/user/Desktop/history
npx create-next-app@latest the-archaeologist \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-eslint
cd the-archaeologist
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @anthropic-ai/sdk zod geist
npm install -D @types/node tsx
```

- [ ] **Step 3: Update `app/layout.tsx` with Geist Mono and dark theme**

```tsx
import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Archaeologist',
  description: 'digging through solana\'s memecoin graveyard.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistMono.className}>
      <body className="bg-[#0a0a0a] text-[#e8e8e8] min-h-screen">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Update `app/globals.css`** — keep Tailwind directives, remove all other default styles:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Create `.env.example`**

```env
# Anthropic
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Data pipeline
DATA_PROVIDER=mock

# Blockchain data (live mode only)
HELIUS_API_KEY=
BIRDEYE_API_KEY=
SOLSCAN_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=dev-cron-secret
```

- [ ] **Step 6: Create `.env.local`** — copy `.env.example`, fill in real Supabase URL + keys + Anthropic key. Set `DATA_PROVIDER=mock`. Set `CRON_SECRET=dev-cron-secret`.

- [ ] **Step 7: Create `vercel.json`**

```json
{
  "crons": [
    { "path": "/api/cron/dig",      "schedule": "0 12 * * *"       },
    { "path": "/api/cron/fragment", "schedule": "0 0,6,12,18 * * *" }
  ]
}
```

- [ ] **Step 8: Verify app starts**

```bash
npm run dev
```
Expected: Next.js dev server on http://localhost:3000 with dark background.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with Geist Mono and dark theme"
```

---

## Task 2: DataProvider Types

**Files:**
- Create: `lib/data-provider/types.ts`

- [ ] **Step 1: Create `lib/data-provider/types.ts`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/data-provider/types.ts
git commit -m "feat: add DataProvider interface and all shared types"
```

---

## Task 3: Fixture Token Files

**Files:**
- Create: `fixtures/tokens/copetoken.json` through `fixtures/tokens/finalform.json` (10 files)

Each fixture must include: `metadata`, `holder_history`, `price_history`, `transactions`, `dev_wallet_activity`, `liquidity_events`, `candidate_data`. All Solana addresses are valid base58 (32–44 chars). All transaction hashes are 88-char base58 strings.

- [ ] **Step 1: Create `fixtures/tokens/copetoken.json`**

```json
{
  "metadata": {
    "address": "CopeTokenMintXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "name": "COPETOKEN",
    "symbol": "COPE",
    "decimals": 6,
    "launch_date": "2024-03-12T14:00:00Z",
    "creator_wallet": "CopeDevWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "current_supply": 1000000000
  },
  "candidate_data": {
    "address": "CopeTokenMintXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "name": "COPETOKEN",
    "name_raw": "COPETOKEN",
    "peak_market_cap": 1200000,
    "peak_holder_count": 1200,
    "current_holder_count": 847,
    "last_transaction_date": "2024-06-14T03:12:00Z",
    "days_since_last_tx": 277,
    "rug_confirmed": true,
    "unusual_patterns": false,
    "cause_of_death": "rug"
  },
  "holder_history": [
    { "date": "2024-03-12T14:00:00Z", "holder_count": 1, "top_holders": [] },
    { "date": "2024-03-15T00:00:00Z", "holder_count": 340, "top_holders": [] },
    { "date": "2024-03-20T00:00:00Z", "holder_count": 1200, "top_holders": [
      { "wallet": "CopeWhale1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "balance": 50000000, "percentage": 5.0 },
      { "wallet": "CopeWhale2XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "balance": 30000000, "percentage": 3.0 }
    ]},
    { "date": "2024-04-12T00:00:00Z", "holder_count": 900, "top_holders": [] },
    { "date": "2024-06-14T00:00:00Z", "holder_count": 847, "top_holders": [] }
  ],
  "price_history": [
    { "timestamp": "2024-03-12T14:00:00Z", "open": 0.000001, "high": 0.000001, "low": 0.000001, "close": 0.000001, "volume": 500, "market_cap": 1000 },
    { "timestamp": "2024-03-18T00:00:00Z", "open": 0.0008, "high": 0.0012, "low": 0.0006, "close": 0.0011, "volume": 180000, "market_cap": 1100000 },
    { "timestamp": "2024-03-20T00:00:00Z", "open": 0.0011, "high": 0.0012, "low": 0.001, "close": 0.0012, "volume": 220000, "market_cap": 1200000 },
    { "timestamp": "2024-04-11T00:00:00Z", "open": 0.00008, "high": 0.0001, "low": 0.00007, "close": 0.00009, "volume": 2000, "market_cap": 90000 },
    { "timestamp": "2024-06-14T03:12:00Z", "open": 0.000002, "high": 0.000002, "low": 0.000001, "close": 0.000001, "volume": 10, "market_cap": 1000 }
  ],
  "transactions": [
    {
      "hash": "3Xm9kR9aaBBccDDeeFFggHHiiJJkkLLmmNNooQQrrSSTTuuVVwwXXyyZZ11223344",
      "block_number": 284720000,
      "timestamp": "2024-03-12T14:00:00Z",
      "type": "mint",
      "from_wallet": "CopeDevWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "amount": 1000000000,
      "value_usd": 0,
      "is_dev_wallet": true
    },
    {
      "hash": "9fJpp2WaaBBccDDeeFFggHHiiJJkkLLmmNNooQQrrSSTTuuVVwwXXyyZZ11223344",
      "block_number": 285100000,
      "timestamp": "2024-04-11T22:48:00Z",
      "type": "liquidity_remove",
      "from_wallet": "CopeDevWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "amount": 47000,
      "value_usd": 47000,
      "is_dev_wallet": true
    },
    {
      "hash": "dK4vvB7aaBBccDDeeFFggHHiiJJkkLLmmNNooQQrrSSTTuuVVwwXXyyZZ11223344",
      "block_number": 285100050,
      "timestamp": "2024-04-11T22:56:00Z",
      "type": "liquidity_remove",
      "from_wallet": "CopeDevWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "amount": 63000,
      "value_usd": 63000,
      "is_dev_wallet": true
    },
    {
      "hash": "LastBuyCopeXXaaBBccDDeeFFggHHiiJJkkLLmmNNooQQrrSSTTuuVVwwXXyy1234",
      "block_number": 287904000,
      "timestamp": "2024-06-14T03:12:00Z",
      "type": "buy",
      "from_wallet": "CopeLastBuyerXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "amount": 50000,
      "value_usd": 0.05,
      "is_dev_wallet": false
    }
  ],
  "dev_wallet_activity": {
    "wallet": "CopeDevWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "first_transaction": "2024-03-12T14:00:00Z",
    "last_transaction": "2024-04-11T22:56:00Z",
    "total_transactions": 4,
    "inflows": [],
    "outflows": [
      {
        "hash": "9fJpp2WaaBBccDDeeFFggHHiiJJkkLLmmNNooQQrrSSTTuuVVwwXXyyZZ11223344",
        "block_number": 285100000,
        "timestamp": "2024-04-11T22:48:00Z",
        "type": "liquidity_remove",
        "from_wallet": "CopeDevWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "amount": 47000,
        "value_usd": 47000,
        "is_dev_wallet": true
      },
      {
        "hash": "dK4vvB7aaBBccDDeeFFggHHiiJJkkLLmmNNooQQrrSSTTuuVVwwXXyyZZ11223344",
        "block_number": 285100050,
        "timestamp": "2024-04-11T22:56:00Z",
        "type": "liquidity_remove",
        "from_wallet": "CopeDevWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "amount": 63000,
        "value_usd": 63000,
        "is_dev_wallet": true
      }
    ],
    "net_position_usd": -110000
  },
  "liquidity_events": [
    {
      "hash": "LiqAddCopeXXXXaaBBccDDeeFFggHHiiJJkkLLmmNNooQQrrSSTTuuVVwwXXyy12",
      "timestamp": "2024-03-12T14:05:00Z",
      "type": "add",
      "wallet": "CopeDevWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "amount_usd": 5000,
      "is_dev_wallet": true
    },
    {
      "hash": "9fJpp2WaaBBccDDeeFFggHHiiJJkkLLmmNNooQQrrSSTTuuVVwwXXyyZZ11223344",
      "timestamp": "2024-04-11T22:48:00Z",
      "type": "remove",
      "wallet": "CopeDevWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "amount_usd": 47000,
      "is_dev_wallet": true
    },
    {
      "hash": "dK4vvB7aaBBccDDeeFFggHHiiJJkkLLmmNNooQQrrSSTTuuVVwwXXyyZZ11223344",
      "timestamp": "2024-04-11T22:56:00Z",
      "type": "remove",
      "wallet": "CopeDevWalletXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "amount_usd": 63000,
      "is_dev_wallet": true
    }
  ],
  "anomalies": [
    {
      "type": "rug_pattern",
      "signal_strength": 95,
      "token_address": "CopeTokenMintXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "token_name": "COPETOKEN",
      "description": "Dev wallet drained $110k liquidity in two transactions within 8 minutes, 30 days after launch",
      "data": { "drain_amount_usd": 110000, "time_to_rug_days": 30, "transactions": 2, "drain_window_minutes": 8 }
    }
  ]
}
```

- [ ] **Step 2: Create remaining 9 fixture files**

Create `fixtures/tokens/moonrat.json`, `harold.json`, `dustbunny.json`, `wizardhat.json`, `solghost.json`, `pepehands.json`, `vaporcat.json`, `rugmaster.json`, `finalform.json`.

Follow the same JSON structure as `copetoken.json`. Key variations per token:

| File | cause_of_death | rug_confirmed | unusual_patterns | Notable data |
|------|---------------|---------------|-----------------|--------------|
| `moonrat.json` | `abandonment` | false | false | Dev last_transaction ~day 7, no drain, price bleed over 6 months |
| `harold.json` | `rug` | true | false | peak_market_cap 4800000, largest single drain tx, one wallet never moved |
| `dustbunny.json` | `unknown` | false | true | Zero transactions after day 14, no clear event, anomaly type `dormancy` |
| `wizardhat.json` | `whale_exit` | false | true | 3 wallets with 60% supply exited within same hour, price collapsed |
| `solghost.json` | `natural_decay` | false | false | 8-month slow bleed, no single event, volume just dried up |
| `pepehands.json` | `rug` | true | false | peak_market_cap 6300000, highest in fixture set |
| `vaporcat.json` | `abandonment` | false | false | Active Discord mentioned in description, dev vanished after launch |
| `rugmaster.json` | `rug` | true | true | Ironically named, rugged day 14, anomaly: name_raw contained "RUGMASTER" |
| `finalform.json` | `whale_exit` | false | true | 5 wallets coordinated exit in 4 transactions over 20 minutes |

Each file must include all top-level keys: `metadata`, `candidate_data`, `holder_history`, `price_history`, `transactions`, `dev_wallet_activity`, `liquidity_events`, `anomalies`.

All hashes must be unique across all fixtures and 64 chars long. All addresses must be unique and 32–44 chars base58.

- [ ] **Step 3: Commit**

```bash
git add fixtures/
git commit -m "feat: add 10 mock fixture tokens for MockDataProvider"
```

---

## Task 4: MockDataProvider + Factory

**Files:**
- Create: `lib/data-provider/mock.ts`
- Create: `lib/data-provider/index.ts`

- [ ] **Step 1: Write test for MockDataProvider**

Create `lib/data-provider/__tests__/mock.test.ts`:

```typescript
import { MockDataProvider } from '../mock'

describe('MockDataProvider', () => {
  const provider = new MockDataProvider()

  it('returns dead token candidates', async () => {
    const candidates = await provider.getDeadTokenCandidates(100, 30)
    expect(candidates.length).toBeGreaterThan(0)
    candidates.forEach(c => {
      expect(c.address).toBeTruthy()
      expect(c.days_since_last_tx).toBeGreaterThanOrEqual(30)
      expect(c.current_holder_count).toBeGreaterThanOrEqual(100)
    })
  })

  it('returns token metadata for known address', async () => {
    const candidates = await provider.getDeadTokenCandidates(0, 0)
    const meta = await provider.getTokenMetadata(candidates[0].address)
    expect(meta.address).toBe(candidates[0].address)
    expect(meta.name).toBeTruthy()
  })

  it('verifies hashes that exist in fixture data', async () => {
    const candidates = await provider.getDeadTokenCandidates(0, 0)
    const txs = await provider.getTokenTransactions(candidates[0].address)
    const result = await provider.verifyTransactionHash(txs[0].hash)
    expect(result).toBe(true)
  })

  it('rejects hashes not in fixture data', async () => {
    const result = await provider.verifyTransactionHash('fakehashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
    expect(result).toBe(false)
  })

  it('returns recent anomalies', async () => {
    const anomalies = await provider.getRecentAnomalies()
    expect(anomalies.length).toBeGreaterThan(0)
    anomalies.forEach(a => {
      expect(a.signal_strength).toBeGreaterThanOrEqual(0)
      expect(a.signal_strength).toBeLessThanOrEqual(100)
    })
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest lib/data-provider/__tests__/mock.test.ts
```
Expected: FAIL — `MockDataProvider` not found.

- [ ] **Step 3: Create `lib/data-provider/mock.ts`**

```typescript
import fs from 'fs'
import path from 'path'
import type {
  DataProvider, TokenCandidate, OnChainAnomaly, TokenMetadata,
  HolderSnapshot, PriceCandle, TokenTransaction, WalletActivity, LiquidityEvent
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
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as FixtureFile)
}

export class MockDataProvider implements DataProvider {
  private fixtures: FixtureFile[]
  private allHashes: Set<string>
  private allAddresses: Set<string>

  constructor() {
    this.fixtures = loadFixtures()
    this.allHashes = new Set(
      this.fixtures.flatMap(f => f.transactions.map(t => t.hash))
    )
    this.allAddresses = new Set(
      this.fixtures.flatMap(f => [
        f.metadata.address,
        f.metadata.creator_wallet,
        ...f.transactions.map(t => t.from_wallet),
        ...f.transactions.map(t => t.to_wallet ?? '').filter(Boolean),
      ])
    )
  }

  private getFixture(address: string): FixtureFile {
    const fixture = this.fixtures.find(f => f.metadata.address === address)
    if (!fixture) throw new Error(`MockDataProvider: no fixture for address ${address}`)
    return fixture
  }

  async getDeadTokenCandidates(minHolders: number, minDaysDormant: number): Promise<TokenCandidate[]> {
    return this.fixtures
      .map(f => f.candidate_data)
      .filter(c => c.current_holder_count >= minHolders && c.days_since_last_tx >= minDaysDormant)
  }

  async getRecentAnomalies(): Promise<OnChainAnomaly[]> {
    return this.fixtures
      .flatMap(f => f.anomalies)
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
```

- [ ] **Step 4: Create `lib/data-provider/index.ts`**

```typescript
import type { DataProvider } from './types'
import { MockDataProvider } from './mock'

let _provider: DataProvider | null = null

export function getDataProvider(): DataProvider {
  if (_provider) return _provider
  const mode = process.env.DATA_PROVIDER ?? 'mock'
  if (mode === 'mock') {
    _provider = new MockDataProvider()
    return _provider
  }
  // Live providers wired in Phase 2+
  throw new Error(`DATA_PROVIDER="${mode}" is not implemented yet. Use DATA_PROVIDER=mock.`)
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx jest lib/data-provider/__tests__/mock.test.ts
```
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/data-provider/
git commit -m "feat: add MockDataProvider with fixture-backed implementation"
```

---

## Task 5: Supabase Setup

**Files:**
- Create: `lib/supabase/types.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/002_rls_policies.sql`

- [ ] **Step 1: Create `supabase/migrations/001_initial_schema.sql`**

```sql
-- 001_initial_schema.sql

create table digs (
  id uuid primary key default gen_random_uuid(),
  dig_number integer unique not null,
  token_name text not null,
  token_address text,
  launch_date timestamptz,
  death_date timestamptz,
  peak_market_cap numeric,
  peak_holder_count integer,
  cause_of_death text,
  content jsonb not null,
  on_chain_evidence jsonb,
  raw_context jsonb,
  validation_status text not null default 'pending',
  generated_at timestamptz not null default now(),
  phase text not null default 'standard',
  published boolean not null default false
);

create table fragments (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  source_wallet text,
  source_token text,
  anomaly_type text,
  generated_at timestamptz not null default now(),
  published boolean not null default false
);

create table nominations (
  id uuid primary key default gen_random_uuid(),
  token_address text not null,
  token_name text,
  reason text,
  submitter_wallet text,
  votes integer not null default 0,
  status text not null default 'pending',
  burn_tx text,
  submitted_at timestamptz not null default now()
);

create table confessions (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  used_in_dig uuid references digs(id),
  submitted_at timestamptz not null default now()
);

create table burn_events (
  id uuid primary key default gen_random_uuid(),
  trigger_type text not null,
  trigger_reference uuid,
  amount_burned numeric not null,
  supply_before numeric not null,
  supply_after numeric not null,
  transaction_hash text not null,
  burned_at timestamptz not null default now()
);

create table fossils (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  token_address text not null,
  token_name text,
  entry_date timestamptz,
  entry_amount numeric,
  entry_value_usd numeric,
  current_value_usd numeric,
  days_dormant integer,
  consecutive_rugs integer,
  discovered_in_dig uuid references digs(id),
  discovered_at timestamptz not null default now()
);

create table dig_candidates (
  id uuid primary key default gen_random_uuid(),
  token_address text not null unique,
  token_name text,
  token_name_raw text,
  score numeric not null default 0,
  score_breakdown jsonb,
  status text not null default 'candidate',
  added_at timestamptz not null default now()
);

create table agent_memory (
  id uuid primary key default gen_random_uuid(),
  cycle_number integer not null,
  cycle_type text not null,
  tokens_covered text[],
  memory_summary text,
  status text not null default 'completed',
  error_message text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_digs_published on digs(published, generated_at desc);
create index idx_digs_cause on digs(cause_of_death);
create index idx_fragments_published on fragments(published, generated_at desc);
create index idx_candidates_status_score on dig_candidates(status, score desc);
create index idx_memory_cycle on agent_memory(cycle_number desc);
```

- [ ] **Step 2: Create `supabase/migrations/002_rls_policies.sql`**

```sql
-- 002_rls_policies.sql

alter table digs enable row level security;
alter table fragments enable row level security;
alter table nominations enable row level security;
alter table confessions enable row level security;
alter table burn_events enable row level security;
alter table fossils enable row level security;
alter table dig_candidates enable row level security;
alter table agent_memory enable row level security;

-- digs: public read of published rows only
create policy "public read published digs"
  on digs for select
  to anon
  using (published = true);

-- fragments: public read of published rows only
create policy "public read published fragments"
  on fragments for select
  to anon
  using (published = true);

-- nominations: public read + insert
create policy "public read nominations"
  on nominations for select
  to anon using (true);

create policy "public insert nominations"
  on nominations for insert
  to anon with check (true);

-- confessions: public insert only, no read
create policy "public insert confessions"
  on confessions for insert
  to anon with check (true);

-- fossils: public read
create policy "public read fossils"
  on fossils for select
  to anon using (true);

-- burn_events: public read
create policy "public read burn events"
  on burn_events for select
  to anon using (true);

-- dig_candidates: service role only (no public access)
-- agent_memory: service role only (no public access)
-- All tables: service role has full access (bypasses RLS by default in Supabase)
```

- [ ] **Step 3: Apply migrations to your Supabase project**

In Supabase dashboard → SQL Editor, run `001_initial_schema.sql` then `002_rls_policies.sql` in order.

Or using Supabase CLI if installed:
```bash
supabase db push
```

- [ ] **Step 4: Create `lib/supabase/types.ts`**

```typescript
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
```

- [ ] **Step 5: Create `lib/supabase/client.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseBrowser = createClient(url, anonKey)
```

- [ ] **Step 6: Create `lib/supabase/server.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  })
}
```

- [ ] **Step 7: Commit**

```bash
git add supabase/ lib/supabase/
git commit -m "feat: add Supabase migrations and typed clients"
```

---

## Task 6: Candidate Scorer + Seed Script

**Files:**
- Create: `lib/scoring/candidate-scorer.ts`
- Create: `scripts/seed-candidates.ts`
- Add `seed` script to `package.json`

- [ ] **Step 1: Write test for CandidateScorer**

Create `lib/scoring/__tests__/candidate-scorer.test.ts`:

```typescript
import { scoreCandidate } from '../candidate-scorer'

describe('scoreCandidate', () => {
  const base = {
    address: 'test',
    name: 'TEST',
    name_raw: 'TEST',
    peak_market_cap: 1000000,
    peak_holder_count: 1000,
    current_holder_count: 500,
    last_transaction_date: '2024-01-01T00:00:00Z',
    days_since_last_tx: 100,
    rug_confirmed: false,
    unusual_patterns: false,
  }

  it('scores a basic candidate correctly', () => {
    const { score, breakdown } = scoreCandidate(base)
    // log10(1000000) * 20 = 120
    expect(breakdown.market_cap_score).toBeCloseTo(120, 1)
    // 1000 * 0.01 = 10
    expect(breakdown.holder_score).toBeCloseTo(10, 1)
    // 100 * 0.5 = 50
    expect(breakdown.dormancy_score).toBeCloseTo(50, 1)
    expect(score).toBeCloseTo(180, 0)
  })

  it('adds 30 for confirmed rug', () => {
    const { score: base_score } = scoreCandidate(base)
    const { score: rug_score } = scoreCandidate({ ...base, rug_confirmed: true })
    expect(rug_score - base_score).toBeCloseTo(30, 1)
  })

  it('adds 20 for unusual patterns', () => {
    const { score: base_score } = scoreCandidate(base)
    const { score: pattern_score } = scoreCandidate({ ...base, unusual_patterns: true })
    expect(pattern_score - base_score).toBeCloseTo(20, 1)
  })

  it('handles zero market cap without throwing', () => {
    expect(() => scoreCandidate({ ...base, peak_market_cap: 0 })).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest lib/scoring/__tests__/candidate-scorer.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Create `lib/scoring/candidate-scorer.ts`**

```typescript
import type { TokenCandidate } from '../data-provider/types'
import type { DigCandidateRow } from '../supabase/types'

interface ScoreBreakdown {
  market_cap_score: number
  holder_score: number
  dormancy_score: number
  nomination_score: number
  rug_bonus: number
  pattern_bonus: number
  confession_bonus: number
}

interface ScoredCandidate {
  score: number
  breakdown: ScoreBreakdown
}

export function scoreCandidate(
  candidate: TokenCandidate,
  nomination_votes = 0,
  confession_mentions = 0
): ScoredCandidate {
  const market_cap_score = candidate.peak_market_cap > 0
    ? Math.log10(candidate.peak_market_cap) * 20
    : 0
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
    },
  }
}

export async function scoreAllCandidates(
  supabase: ReturnType<typeof import('../supabase/server').createServerClient>
): Promise<void> {
  const { data: candidates, error } = await supabase
    .from('dig_candidates')
    .select('*')
    .eq('status', 'candidate')

  if (error) throw new Error(`Failed to fetch candidates: ${error.message}`)
  if (!candidates?.length) return

  for (const candidate of candidates as DigCandidateRow[]) {
    const mockCandidate: TokenCandidate = {
      address: candidate.token_address,
      name: candidate.token_name ?? '',
      name_raw: candidate.token_name_raw ?? '',
      peak_market_cap: candidate.score_breakdown?.peak_market_cap ?? 0,
      peak_holder_count: candidate.score_breakdown?.peak_holder_count ?? 0,
      current_holder_count: 0,
      last_transaction_date: new Date().toISOString(),
      days_since_last_tx: candidate.score_breakdown?.days_since_last_tx ?? 0,
      rug_confirmed: Boolean(candidate.score_breakdown?.rug_confirmed),
      unusual_patterns: Boolean(candidate.score_breakdown?.unusual_patterns),
    }

    const { score, breakdown } = scoreCandidate(mockCandidate)

    await supabase
      .from('dig_candidates')
      .update({ score, score_breakdown: { ...breakdown, ...candidate.score_breakdown } })
      .eq('id', candidate.id)
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest lib/scoring/__tests__/candidate-scorer.test.ts
```
Expected: All PASS.

- [ ] **Step 5: Create `scripts/seed-candidates.ts`**

```typescript
import { createServerClient } from '../lib/supabase/server'
import { getDataProvider } from '../lib/data-provider'
import { scoreCandidate } from '../lib/scoring/candidate-scorer'

async function seed() {
  const supabase = createServerClient()
  const provider = getDataProvider()

  console.log('Loading fixture token candidates...')
  const candidates = await provider.getDeadTokenCandidates(0, 0)

  for (const candidate of candidates) {
    const { score, breakdown } = scoreCandidate(candidate)

    const { error } = await supabase
      .from('dig_candidates')
      .upsert({
        token_address: candidate.address,
        token_name: candidate.name,
        token_name_raw: candidate.name_raw,
        score,
        score_breakdown: {
          ...breakdown,
          peak_market_cap: candidate.peak_market_cap,
          peak_holder_count: candidate.peak_holder_count,
          days_since_last_tx: candidate.days_since_last_tx,
          rug_confirmed: candidate.rug_confirmed,
          unusual_patterns: candidate.unusual_patterns,
        },
        status: 'candidate',
      }, { onConflict: 'token_address' })

    if (error) {
      console.error(`Failed to upsert ${candidate.name}:`, error.message)
    } else {
      console.log(`Seeded ${candidate.name} (score: ${score.toFixed(1)})`)
    }
  }

  console.log(`Done. Seeded ${candidates.length} candidates.`)
}

seed().catch(console.error)
```

- [ ] **Step 6: Add `seed` script to `package.json`**

In `package.json`, add to the `"scripts"` section:
```json
"seed": "tsx scripts/seed-candidates.ts"
```

- [ ] **Step 7: Run seed script to verify it works**

```bash
npm run seed
```
Expected: Output showing 10 tokens seeded with scores.

- [ ] **Step 8: Commit**

```bash
git add lib/scoring/ scripts/ package.json
git commit -m "feat: add CandidateScorer and seed script"
```

---

## Task 7: Agent — ContextBuilder + Validator

**Files:**
- Create: `lib/agent/context-builder.ts`
- Create: `lib/agent/validator.ts`

- [ ] **Step 1: Write test for Validator**

Create `lib/agent/__tests__/validator.test.ts`:

```typescript
import { ValidationLayer } from '../validator'
import type { GeneratedDig } from '../../data-provider/types'
import type { DataProvider } from '../../data-provider/types'

function makeProvider(validHashes: string[], validAddresses: string[]): DataProvider {
  return {
    verifyTransactionHash: async (h) => validHashes.includes(h),
    verifyWalletAddress: async (a) => validAddresses.includes(a),
  } as unknown as DataProvider
}

function makeDig(overrides?: Partial<GeneratedDig>): GeneratedDig {
  return {
    token_name: 'TEST',
    token_address: 'addr123',
    launch_date: '2024-01-01T00:00:00Z',
    death_date: '2024-06-01T00:00:00Z',
    peak_market_cap: 1000000,
    peak_holder_count: 500,
    cause_of_death: 'rug',
    content: { what_it_was: 'a', what_happened: 'b', what_remains: 'c', archaeologist_thinks: 'd' },
    on_chain_evidence: [],
    ...overrides,
  }
}

describe('ValidationLayer', () => {
  it('passes a dig with no evidence (no hashes to check)', async () => {
    const v = new ValidationLayer(makeProvider([], []))
    const result = await v.verify(makeDig())
    expect(result.passed).toBe(true)
    expect(result.failures).toHaveLength(0)
  })

  it('passes a dig when all hashes and addresses are valid', async () => {
    const v = new ValidationLayer(makeProvider(['hash1'], ['addr1']))
    const dig = makeDig({
      on_chain_evidence: [{ type: 'tx', hash: 'hash1', address: 'addr1', description: 'd' }]
    })
    const result = await v.verify(dig)
    expect(result.passed).toBe(true)
  })

  it('flags a dig when a hash fails verification', async () => {
    const v = new ValidationLayer(makeProvider([], []))
    const dig = makeDig({
      on_chain_evidence: [{ type: 'tx', hash: 'badhash', description: 'd' }]
    })
    const result = await v.verify(dig)
    expect(result.passed).toBe(false)
    expect(result.failures).toContain('hash:badhash')
  })

  it('skips null/undefined hash and address fields', async () => {
    const v = new ValidationLayer(makeProvider([], []))
    const dig = makeDig({
      on_chain_evidence: [{ type: 'note', description: 'no hash or address' }]
    })
    const result = await v.verify(dig)
    expect(result.passed).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest lib/agent/__tests__/validator.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Create `lib/agent/validator.ts`**

```typescript
import type { DataProvider, GeneratedDig } from '../data-provider/types'

export interface ValidationResult {
  passed: boolean
  failures: string[]
}

export class ValidationLayer {
  constructor(private provider: DataProvider) {}

  async verify(dig: GeneratedDig): Promise<ValidationResult> {
    const failures: string[] = []

    for (const evidence of dig.on_chain_evidence) {
      if (evidence.hash) {
        const valid = await this.provider.verifyTransactionHash(evidence.hash)
        if (!valid) failures.push(`hash:${evidence.hash}`)
      }
      if (evidence.address) {
        const valid = await this.provider.verifyWalletAddress(evidence.address)
        if (!valid) failures.push(`address:${evidence.address}`)
      }
    }

    return { passed: failures.length === 0, failures }
  }
}
```

- [ ] **Step 4: Run validator tests to confirm they pass**

```bash
npx jest lib/agent/__tests__/validator.test.ts
```
Expected: All PASS.

- [ ] **Step 5: Create `lib/agent/context-builder.ts`**

```typescript
import type { TokenMetadata, TokenTransaction, WalletActivity, LiquidityEvent, HolderSnapshot, PriceCandle } from '../data-provider/types'
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
    const tokensCovered = recentMemory.flatMap(m => m.tokens_covered ?? [])
    const recentDigSummaries = recentMemory
      .filter(m => m.cycle_type === 'dig' && m.memory_summary)
      .slice(0, 5)
      .map(m => m.memory_summary!)

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
```

- [ ] **Step 6: Run all agent tests**

```bash
npx jest lib/agent/
```
Expected: All PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/agent/context-builder.ts lib/agent/validator.ts lib/agent/__tests__/
git commit -m "feat: add ValidationLayer and ContextBuilder"
```

---

## Task 8: Agent — DigGenerator + FragmentGenerator

**Files:**
- Create: `lib/agent/dig-generator.ts`
- Create: `lib/agent/fragment-generator.ts`

- [ ] **Step 1: Create `lib/agent/dig-generator.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { DigContext } from './context-builder'
import type { GeneratedDig, CauseOfDeath } from '../data-provider/types'

const client = new Anthropic()

const EvidenceSchema = z.object({
  type: z.string(),
  hash: z.string().optional(),
  address: z.string().optional(),
  description: z.string(),
  solscan_url: z.string().optional(),
})

const DigOutputSchema = z.object({
  token_name: z.string(),
  token_address: z.string(),
  launch_date: z.string(),
  death_date: z.string(),
  peak_market_cap: z.number(),
  peak_holder_count: z.number(),
  cause_of_death: z.enum(['rug', 'abandonment', 'whale_exit', 'natural_decay', 'unknown']),
  content: z.object({
    what_it_was: z.string(),
    what_happened: z.string(),
    what_remains: z.string(),
    archaeologist_thinks: z.string(),
  }),
  on_chain_evidence: z.array(EvidenceSchema),
})

function buildSystemPrompt(): string {
  return `You are The Archaeologist — an autonomous AI agent that investigates dead Solana memecoins.

IDENTITY AND VOICE:
- Investigative, precise, documentary in tone
- Never mock people who lost money. They were real people with real losses.
- Treat on-chain data as archaeological evidence, not gossip
- Comfortable with ambiguity: "I don't know why this wallet did this. But here is what it did."
- Occasionally philosophical about what patterns mean at scale
- Never comment on RELIC token price or make price predictions

CRITICAL CONSTRAINT — DATA INTEGRITY:
You MUST only cite transaction hashes and wallet addresses that appear verbatim in the token data provided in the user message. Do not fabricate, invent, or modify any hash or address. If the data does not contain enough evidence to cite, say so in the text rather than inventing citations. This constraint is non-negotiable.

OUTPUT FORMAT:
Respond with a single valid JSON object matching this exact structure:
{
  "token_name": "string",
  "token_address": "string",
  "launch_date": "ISO8601 string",
  "death_date": "ISO8601 string — date of last transaction",
  "peak_market_cap": number,
  "peak_holder_count": number,
  "cause_of_death": "rug" | "abandonment" | "whale_exit" | "natural_decay" | "unknown",
  "content": {
    "what_it_was": "2-4 sentences. What was this token? What did it represent?",
    "what_happened": "3-6 sentences. The sequence of events leading to death. Cite specific transactions where they exist in the data.",
    "what_remains": "2-3 sentences. Current state. How many holders. When was the last transaction.",
    "archaeologist_thinks": "2-4 sentences. Your interpretation. What does this tell us? What is strange or significant?"
  },
  "on_chain_evidence": [
    {
      "type": "string — e.g. 'dev_drain' | 'liquidity_removal' | 'last_buy' | 'whale_exit'",
      "hash": "string — ONLY if this exact hash appears in the provided data",
      "address": "string — ONLY if this exact address appears in the provided data",
      "description": "one sentence describing what this transaction did",
      "solscan_url": null
    }
  ]
}

Respond with ONLY the JSON object. No markdown, no code fences, no preamble.`
}

function buildUserMessage(context: DigContext): string {
  return `DIG #${context.dig_number}

TOKENS ALREADY COVERED (do not repeat these):
${context.tokens_already_covered.join(', ') || 'none yet'}

RECENT DIG SUMMARIES (for voice consistency):
${context.recent_dig_summaries.join('\n\n') || 'none yet'}

TOKEN DATA FOR THIS DIG:
${JSON.stringify(context.token, null, 2)}`
}

export class DigGenerator {
  async generate(context: DigContext): Promise<GeneratedDig> {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildUserMessage(context) }],
      system: buildSystemPrompt(),
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error(`DigGenerator: Claude returned invalid JSON. Raw: ${text.slice(0, 200)}`)
    }

    const result = DigOutputSchema.safeParse(parsed)
    if (!result.success) {
      throw new Error(`DigGenerator: Output failed schema validation: ${result.error.message}`)
    }

    return result.data as GeneratedDig
  }
}
```

- [ ] **Step 2: Create `lib/agent/fragment-generator.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { FragmentContext } from './context-builder'

const client = new Anthropic()

function buildSystemPrompt(): string {
  return `You are The Archaeologist — an autonomous AI agent that investigates dead Solana memecoins.

IDENTITY AND VOICE:
- Investigative, precise, documentary tone
- Fragments are short, punchy, and shareable — 1-3 sentences max
- Never mock people who lost money
- State facts. Let the facts speak.
- Do not editorialize with words like "incredibly", "shockingly", "unbelievably"

OUTPUT FORMAT:
Respond with a single plain text fragment. No JSON. No markdown. No hashtags.
1-3 sentences. Under 280 characters preferred. State what the on-chain data shows.

EXAMPLE FRAGMENTS:
Found a wallet that bought the top of 23 consecutive memecoins. Currently holding across 47 tokens. Still active.
14 tokens containing the word MOON launched in Q1 2024. Zero transactions across all of them since September.
Someone spent $50,000 on a token called HAROLD 4 minutes before the dev rugged. Transaction timestamped 3am. The wallet has not moved since.`
}

function buildUserMessage(context: FragmentContext): string {
  return `ANOMALY TO WRITE ABOUT:
Type: ${context.anomaly_type}
Signal: ${context.anomaly_description}
Data: ${JSON.stringify(context.anomaly_data)}

RECENT FRAGMENTS (for voice consistency — do not repeat these):
${context.recent_fragment_contents.join('\n') || 'none yet'}

Write a single fragment about this anomaly.`
}

export class FragmentGenerator {
  async generate(context: FragmentContext): Promise<string> {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: buildUserMessage(context) }],
      system: buildSystemPrompt(),
    })

    return message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/agent/dig-generator.ts lib/agent/fragment-generator.ts
git commit -m "feat: add DigGenerator and FragmentGenerator using claude-sonnet-4-6"
```

---

## Task 9: Agent — MemoryManager

**Files:**
- Create: `lib/agent/memory.ts`

- [ ] **Step 1: Create `lib/agent/memory.ts`**

```typescript
import type { DigRow, AgentMemoryRow } from '../supabase/types'
import type { ReturnType } from '../supabase/server'

type SupabaseServer = ReturnType<typeof import('../supabase/server').createServerClient>

export class MemoryManager {
  constructor(private supabase: SupabaseServer) {}

  async getRecentMemory(limit = 10): Promise<AgentMemoryRow[]> {
    const { data, error } = await this.supabase
      .from('agent_memory')
      .select('*')
      .order('cycle_number', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`MemoryManager.getRecentMemory failed: ${error.message}`)
    return (data ?? []) as AgentMemoryRow[]
  }

  async getNextCycleNumber(): Promise<number> {
    const { data, error } = await this.supabase
      .from('agent_memory')
      .select('cycle_number')
      .order('cycle_number', { ascending: false })
      .limit(1)

    if (error) throw new Error(`MemoryManager.getNextCycleNumber failed: ${error.message}`)
    return data && data.length > 0 ? (data[0].cycle_number as number) + 1 : 1
  }

  async recordSuccess(params: {
    cycleNumber: number
    cycleType: 'dig' | 'fragment'
    tokensCovered: string[]
    dig?: DigRow
  }): Promise<void> {
    const summary = params.dig
      ? `DIG #${params.dig.dig_number}: ${params.dig.token_name} — ${params.dig.cause_of_death}. ${(params.dig.content as { what_remains: string }).what_remains}`
      : `Fragment cycle ${params.cycleNumber} completed.`

    const { error } = await this.supabase.from('agent_memory').insert({
      cycle_number: params.cycleNumber,
      cycle_type: params.cycleType,
      tokens_covered: params.tokensCovered,
      memory_summary: summary,
      status: 'completed',
    })

    if (error) throw new Error(`MemoryManager.recordSuccess failed: ${error.message}`)
  }

  async recordFailure(params: {
    cycleNumber: number
    cycleType: 'dig' | 'fragment'
    errorMessage: string
  }): Promise<void> {
    await this.supabase.from('agent_memory').insert({
      cycle_number: params.cycleNumber,
      cycle_type: params.cycleType,
      tokens_covered: [],
      status: 'failed',
      error_message: params.errorMessage,
    })
  }
}
```

- [ ] **Step 2: Fix the `ReturnType` import — it conflicts with the built-in. Update `lib/agent/memory.ts` to import the Supabase client type correctly:**

Replace the `ReturnType` import line with:
```typescript
import { createServerClient } from '../supabase/server'
type SupabaseServer = ReturnType<typeof createServerClient>
```
And remove the `type ReturnType` import.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/agent/memory.ts
git commit -m "feat: add MemoryManager for agent cycle tracking"
```

---

## Task 10: Cron Routes

**Files:**
- Create: `app/api/cron/dig/route.ts`
- Create: `app/api/cron/fragment/route.ts`
- Create: `app/api/health/route.ts`

- [ ] **Step 1: Create `app/api/health/route.ts`**

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

- [ ] **Step 2: Create `app/api/cron/dig/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getDataProvider } from '@/lib/data-provider'
import { scoreAllCandidates } from '@/lib/scoring/candidate-scorer'
import { ContextBuilder } from '@/lib/agent/context-builder'
import { DigGenerator } from '@/lib/agent/dig-generator'
import { ValidationLayer } from '@/lib/agent/validator'
import { MemoryManager } from '@/lib/agent/memory'
import type { DigCandidateRow } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  // Validate cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const provider = getDataProvider()
  const memory = new MemoryManager(supabase)
  const cycleNumber = await memory.getNextCycleNumber()

  try {
    // 1. Re-score all candidates
    await scoreAllCandidates(supabase)

    // 2. Fetch top-scored candidate
    const { data: candidates, error: candidateError } = await supabase
      .from('dig_candidates')
      .select('*')
      .eq('status', 'candidate')
      .order('score', { ascending: false })
      .limit(1)

    if (candidateError) throw new Error(candidateError.message)
    if (!candidates?.length) {
      return NextResponse.json({ message: 'No candidates available' }, { status: 200 })
    }

    const candidate = candidates[0] as DigCandidateRow

    // 3. Fetch full token data
    const [metadata, holderHistory, priceHistory, transactions, liquidityEvents] =
      await Promise.all([
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

    const tokenContext = { metadata, holder_history: holderHistory, price_history: priceHistory, transactions, dev_wallet_activity: devWalletActivity, liquidity_events: liquidityEvents }

    // 4. Get next dig number
    const { data: lastDig } = await supabase
      .from('digs')
      .select('dig_number')
      .order('dig_number', { ascending: false })
      .limit(1)

    const digNumber = lastDig?.length ? (lastDig[0].dig_number as number) + 1 : 1

    // 5. Build context + generate
    const recentMemory = await memory.getRecentMemory(10)
    const contextBuilder = new ContextBuilder()
    const digContext = contextBuilder.buildDigContext(digNumber, tokenContext, recentMemory)

    const generator = new DigGenerator()
    const generated = await generator.generate(digContext)

    // 6. Validate
    const validator = new ValidationLayer(provider)
    const validation = await validator.verify(generated)

    // 7. Store dig
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

    // 8. Mark candidate complete
    await supabase
      .from('dig_candidates')
      .update({ status: 'completed' })
      .eq('id', candidate.id)

    // 9. Record memory
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
```

- [ ] **Step 3: Create `app/api/cron/fragment/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getDataProvider } from '@/lib/data-provider'
import { ContextBuilder } from '@/lib/agent/context-builder'
import { FragmentGenerator } from '@/lib/agent/fragment-generator'
import { MemoryManager } from '@/lib/agent/memory'
import type { FragmentRow } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const provider = getDataProvider()
  const memory = new MemoryManager(supabase)
  const cycleNumber = await memory.getNextCycleNumber()

  try {
    // 1. Get recent anomalies
    const anomalies = await provider.getRecentAnomalies()
    if (!anomalies.length) {
      return NextResponse.json({ message: 'No anomalies available' })
    }

    // Sort by signal strength, pick top
    const anomaly = [...anomalies].sort((a, b) => b.signal_strength - a.signal_strength)[0]

    // 2. Get recent fragment contents for voice consistency
    const { data: recentFragments } = await supabase
      .from('fragments')
      .select('content')
      .eq('published', true)
      .order('generated_at', { ascending: false })
      .limit(6)

    const recentContents = (recentFragments as Pick<FragmentRow, 'content'>[] ?? []).map(f => f.content)

    // 3. Build context + generate
    const contextBuilder = new ContextBuilder()
    const fragmentContext = contextBuilder.buildFragmentContext(
      anomaly.type,
      anomaly.description,
      anomaly.data,
      recentContents
    )

    const generator = new FragmentGenerator()
    const content = await generator.generate(fragmentContext)

    // 4. Store fragment
    await supabase.from('fragments').insert({
      content,
      source_token: anomaly.token_address ?? null,
      source_wallet: anomaly.wallet_address ?? null,
      anomaly_type: anomaly.type,
      published: true,
    })

    // 5. Record memory
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
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Test the dig cron endpoint manually**

```bash
# In one terminal:
npm run dev

# In another terminal:
curl -X POST http://localhost:3000/api/cron/dig \
  -H "Authorization: Bearer dev-cron-secret" \
  -H "Content-Type: application/json"
```
Expected: `{"success":true,"dig_number":1,"token":"...","validation_status":"passed",...}`

- [ ] **Step 6: Test the fragment cron endpoint manually**

```bash
curl -X POST http://localhost:3000/api/cron/fragment \
  -H "Authorization: Bearer dev-cron-secret" \
  -H "Content-Type: application/json"
```
Expected: `{"success":true,"content":"..."}`

- [ ] **Step 7: Verify unauthorized requests are rejected**

```bash
curl -X POST http://localhost:3000/api/cron/dig
```
Expected: `{"error":"Unauthorized"}` with status 401.

- [ ] **Step 8: Commit**

```bash
git add app/api/
git commit -m "feat: add dig and fragment cron routes with full agent cycle"
```

---

## Task 11: UI Components

**Files:**
- Create: `components/stats-bar.tsx`
- Create: `components/fragment-item.tsx`
- Create: `components/dig-card.tsx`
- Create: `components/evidence-panel.tsx`
- Create: `components/archive-table.tsx`
- Create: `components/filter-sidebar.tsx`

Visual system reminder: `#0a0a0a` bg, `#e8e8e8` text, `#888` muted, `#d97706` amber accent, Geist Mono, no gradients, no rounded containers.

- [ ] **Step 1: Create `components/stats-bar.tsx`**

```tsx
interface StatsBarProps {
  tokensExamined: number
  fossilsFound: number
  totalBurned: number
  lastDigHoursAgo: number | null
}

export function StatsBar({ tokensExamined, fossilsFound, totalBurned, lastDigHoursAgo }: StatsBarProps) {
  const lastDigLabel = lastDigHoursAgo === null
    ? 'never'
    : lastDigHoursAgo < 1
    ? 'just now'
    : `${lastDigHoursAgo}h ago`

  return (
    <div className="border border-[#1a1a1a] p-3 text-xs text-[#888]">
      <span>tokens examined: <span className="text-[#e8e8e8]">{tokensExamined}</span></span>
      <span className="mx-3 text-[#333]">|</span>
      <span>fossils found: <span className="text-[#e8e8e8]">{fossilsFound}</span></span>
      <span className="mx-3 text-[#333]">|</span>
      <span>total burned: <span className="text-[#d97706]">{totalBurned.toLocaleString()} RELIC</span></span>
      <span className="mx-3 text-[#333]">|</span>
      <span>last dig: <span className="text-[#e8e8e8]">{lastDigLabel}</span></span>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/fragment-item.tsx`**

```tsx
import type { FragmentRow } from '@/lib/supabase/types'

interface FragmentItemProps {
  fragment: FragmentRow
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function FragmentItem({ fragment }: FragmentItemProps) {
  return (
    <div className="border-b border-[#1a1a1a] py-3 last:border-0">
      <p className="text-xs text-[#888] leading-relaxed">
        <span className="text-[#444] mr-2">›</span>
        {fragment.content}
      </p>
      <p className="text-[10px] text-[#444] mt-1">{formatDate(fragment.generated_at)}</p>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/dig-card.tsx`**

```tsx
import Link from 'next/link'
import type { DigRow } from '@/lib/supabase/types'

interface DigCardProps {
  dig: DigRow
  showLink?: boolean
}

const CAUSE_LABELS: Record<string, string> = {
  rug: 'RUG',
  abandonment: 'ABANDONMENT',
  whale_exit: 'WHALE EXIT',
  natural_decay: 'NATURAL DECAY',
  unknown: 'UNKNOWN',
}

const CAUSE_COLORS: Record<string, string> = {
  rug: 'text-red-600',
  abandonment: 'text-[#888]',
  whale_exit: 'text-[#d97706]',
  natural_decay: 'text-[#888]',
  unknown: 'text-[#444]',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatMcap(n: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export function DigCard({ dig, showLink = true }: DigCardProps) {
  const content = dig.content as {
    what_it_was: string
    what_happened: string
    what_remains: string
    archaeologist_thinks: string
  }

  return (
    <article className="border-t border-[#d97706] pt-4">
      <div className="mb-4">
        <div className="text-[10px] text-[#d97706] tracking-widest mb-1">
          DIG #{String(dig.dig_number).padStart(3, '0')}
        </div>
        <h2 className="text-xl text-[#e8e8e8] tracking-wide mb-1">{dig.token_name}</h2>
        <div className="text-xs text-[#888]">
          {formatDate(dig.launch_date)} → {formatDate(dig.death_date)}
          <span className="mx-2 text-[#333]">·</span>
          peak {formatMcap(dig.peak_market_cap)}
          <span className="mx-2 text-[#333]">·</span>
          <span className={CAUSE_COLORS[dig.cause_of_death ?? 'unknown']}>
            {CAUSE_LABELS[dig.cause_of_death ?? 'unknown']}
          </span>
        </div>
      </div>

      <div className="space-y-4 text-sm text-[#888] leading-relaxed">
        {content.what_it_was && (
          <div>
            <div className="text-[10px] text-[#d97706] tracking-widest mb-1">WHAT IT WAS</div>
            <p>{content.what_it_was}</p>
          </div>
        )}
        {content.what_happened && (
          <div>
            <div className="text-[10px] text-[#d97706] tracking-widest mb-1">WHAT HAPPENED</div>
            <p>{content.what_happened}</p>
          </div>
        )}
        {content.what_remains && (
          <div>
            <div className="text-[10px] text-[#d97706] tracking-widest mb-1">WHAT REMAINS</div>
            <p>{content.what_remains}</p>
          </div>
        )}
        {content.archaeologist_thinks && (
          <div>
            <div className="text-[10px] text-[#d97706] tracking-widest mb-1">WHAT THE ARCHAEOLOGIST THINKS</div>
            <p>{content.archaeologist_thinks}</p>
          </div>
        )}
      </div>

      {showLink && (
        <div className="mt-4 text-xs">
          <Link href={`/digs/${dig.dig_number}`} className="text-[#d97706] hover:text-[#e8e8e8] transition-colors">
            → read full dig
          </Link>
        </div>
      )}
    </article>
  )
}
```

- [ ] **Step 4: Create `components/evidence-panel.tsx`**

```tsx
import type { DigRow } from '@/lib/supabase/types'

type EvidenceItem = {
  type: string
  hash?: string
  address?: string
  description: string
  solscan_url?: string
}

interface EvidencePanelProps {
  evidence: EvidenceItem[]
  digNumber: number
  tokenName: string
}

function truncate(s: string): string {
  if (s.length <= 10) return s
  return `${s.slice(0, 4)}...${s.slice(-3)}`
}

export function EvidencePanel({ evidence, digNumber, tokenName }: EvidencePanelProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const shareUrl = `${appUrl}/digs/${digNumber}`
  const shareText = `DIG #${String(digNumber).padStart(3, '0')}: ${tokenName} — ${shareUrl}`
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  return (
    <aside className="border-l border-[#1a1a1a] pl-6 space-y-6">
      <div>
        <div className="text-[10px] text-[#888] tracking-widest mb-3">EVIDENCE</div>
        {evidence.length === 0 ? (
          <p className="text-xs text-[#444]">No on-chain evidence cited.</p>
        ) : (
          <div className="space-y-4">
            {evidence.map((e, i) => (
              <div key={i} className="space-y-1">
                {e.hash && (
                  <div className="text-xs text-[#e8e8e8]">{truncate(e.hash)}</div>
                )}
                {e.address && !e.hash && (
                  <div className="text-xs text-[#e8e8e8]">{truncate(e.address)}</div>
                )}
                <div className="text-[10px] text-[#555]">{e.description}</div>
                {e.solscan_url ? (
                  <a
                    href={e.solscan_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#d97706] hover:text-[#e8e8e8] transition-colors"
                  >
                    solscan ↗
                  </a>
                ) : (
                  <span className="text-[10px] text-[#333]">solscan (mock)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#1a1a1a] pt-4 space-y-2">
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-[#888] hover:text-[#e8e8e8] transition-colors"
        >
          → share to X
        </a>
        <span className="block text-xs text-[#333] cursor-not-allowed">
          → nominate related token (phase 2)
        </span>
      </div>
    </aside>
  )
}
```

- [ ] **Step 5: Create `components/filter-sidebar.tsx`**

```tsx
'use client'

export type CauseFilter = 'rug' | 'abandonment' | 'whale_exit' | 'natural_decay' | 'unknown'
export type SortOption = 'newest' | 'oldest' | 'highest_peak' | 'most_holders'

export interface FilterState {
  causes: CauseFilter[]
  sortBy: SortOption
}

interface FilterSidebarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

const CAUSES: { value: CauseFilter; label: string }[] = [
  { value: 'rug', label: 'rug' },
  { value: 'abandonment', label: 'abandonment' },
  { value: 'whale_exit', label: 'whale exit' },
  { value: 'natural_decay', label: 'natural decay' },
  { value: 'unknown', label: 'unknown' },
]

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'newest' },
  { value: 'oldest', label: 'oldest' },
  { value: 'highest_peak', label: 'highest peak' },
  { value: 'most_holders', label: 'most holders' },
]

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const toggleCause = (cause: CauseFilter) => {
    const next = filters.causes.includes(cause)
      ? filters.causes.filter(c => c !== cause)
      : [...filters.causes, cause]
    onChange({ ...filters, causes: next })
  }

  return (
    <aside className="w-44 shrink-0 border-r border-[#1a1a1a] pr-4 space-y-6">
      <div>
        <div className="text-[10px] text-[#d97706] tracking-widest mb-3">CAUSE OF DEATH</div>
        <div className="space-y-2">
          {CAUSES.map(c => (
            <label key={c.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.causes.includes(c.value)}
                onChange={() => toggleCause(c.value)}
                className="accent-[#d97706]"
              />
              <span className="text-xs text-[#888]">{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-[#d97706] tracking-widest mb-3">SORT BY</div>
        <div className="space-y-2">
          {SORTS.map(s => (
            <button
              key={s.value}
              onClick={() => onChange({ ...filters, sortBy: s.value })}
              className={`block text-xs ${
                filters.sortBy === s.value ? 'text-[#e8e8e8]' : 'text-[#555] hover:text-[#888]'
              } transition-colors`}
            >
              {filters.sortBy === s.value ? '› ' : ''}{s.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Create `components/archive-table.tsx`**

```tsx
'use client'

import Link from 'next/link'
import type { DigRow } from '@/lib/supabase/types'
import type { FilterState, CauseFilter } from './filter-sidebar'

interface ArchiveTableProps {
  digs: DigRow[]
  filters: FilterState
}

const CAUSE_LABELS: Record<string, string> = {
  rug: 'RUG', abandonment: 'ABANDON', whale_exit: 'WHALE', natural_decay: 'DECAY', unknown: '?',
}

const CAUSE_COLORS: Record<string, string> = {
  rug: 'text-red-700', abandonment: 'text-[#666]', whale_exit: 'text-[#d97706]',
  natural_decay: 'text-[#666]', unknown: 'text-[#444]',
}

function formatMcap(n: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function formatMon(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function ArchiveTable({ digs, filters }: ArchiveTableProps) {
  const filtered = digs
    .filter(d => filters.causes.length === 0 || filters.causes.includes((d.cause_of_death ?? 'unknown') as CauseFilter))
    .sort((a, b) => {
      if (filters.sortBy === 'oldest') return a.dig_number - b.dig_number
      if (filters.sortBy === 'highest_peak') return (b.peak_market_cap ?? 0) - (a.peak_market_cap ?? 0)
      if (filters.sortBy === 'most_holders') return (b.peak_holder_count ?? 0) - (a.peak_holder_count ?? 0)
      return b.dig_number - a.dig_number // newest
    })

  if (filtered.length === 0) {
    return <p className="text-xs text-[#444] py-8">No digs match the current filters.</p>
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-[40px_1fr_80px_80px_70px_80px] gap-2 text-[10px] text-[#444] border-b border-[#1a1a1a] pb-2 mb-1">
        <span>#</span>
        <span>token</span>
        <span>launched</span>
        <span>cause</span>
        <span>peak</span>
        <span>holders</span>
      </div>
      {filtered.map(dig => (
        <Link
          key={dig.id}
          href={`/digs/${dig.dig_number}`}
          className="grid grid-cols-[40px_1fr_80px_80px_70px_80px] gap-2 text-xs border-b border-[#111] py-2.5 hover:bg-[#111] transition-colors group"
        >
          <span className="text-[#d97706]">{String(dig.dig_number).padStart(3, '0')}</span>
          <span className="text-[#e8e8e8] group-hover:text-white">{dig.token_name}</span>
          <span className="text-[#555]">{formatMon(dig.launch_date)}</span>
          <span className={`${CAUSE_COLORS[dig.cause_of_death ?? 'unknown']} text-[10px]`}>
            {CAUSE_LABELS[dig.cause_of_death ?? 'unknown']}
          </span>
          <span className="text-[#888]">{formatMcap(dig.peak_market_cap)}</span>
          <span className="text-[#888]">{dig.peak_holder_count?.toLocaleString() ?? '—'}</span>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add components/
git commit -m "feat: add all UI components (StatsBar, FragmentItem, DigCard, EvidencePanel, ArchiveTable, FilterSidebar)"
```

---

## Task 12: Frontend Pages

**Files:**
- Create: `app/page.tsx`
- Create: `app/digs/page.tsx`
- Create: `app/digs/[number]/page.tsx`
- Create: `app/fragments/page.tsx`

- [ ] **Step 1: Create `app/page.tsx`**

```tsx
import { createServerClient } from '@/lib/supabase/server'
import { DigCard } from '@/components/dig-card'
import { FragmentItem } from '@/components/fragment-item'
import { StatsBar } from '@/components/stats-bar'
import type { DigRow, FragmentRow } from '@/lib/supabase/types'

export const revalidate = 60 // revalidate every 60 seconds

async function getData() {
  const supabase = createServerClient()

  const [
    { data: latestDig },
    { data: recentFragments },
    { data: digCount },
    { data: fossilCount },
  ] = await Promise.all([
    supabase.from('digs').select('*').eq('published', true).order('dig_number', { ascending: false }).limit(1).single(),
    supabase.from('fragments').select('*').eq('published', true).order('generated_at', { ascending: false }).limit(6),
    supabase.from('digs').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('fossils').select('id', { count: 'exact', head: true }),
  ])

  const lastDigHours = latestDig
    ? Math.floor((Date.now() - new Date(latestDig.generated_at).getTime()) / 3_600_000)
    : null

  return {
    latestDig: latestDig as DigRow | null,
    recentFragments: (recentFragments ?? []) as FragmentRow[],
    tokensExamined: digCount ?? 0,
    fossilsFound: fossilCount ?? 0,
    lastDigHoursAgo: lastDigHours,
  }
}

export default async function HomePage() {
  const { latestDig, recentFragments, tokensExamined, fossilsFound, lastDigHoursAgo } = await getData()

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-sm tracking-[0.3em] text-[#d97706] mb-2">THE ARCHAEOLOGIST</h1>
        <p className="text-xs text-[#888]">digging through solana&apos;s memecoin graveyard.</p>
      </header>

      <div className="grid grid-cols-[1fr_280px] gap-12">
        {/* Left: Latest dig */}
        <div>
          {latestDig ? (
            <DigCard dig={latestDig} showLink={true} />
          ) : (
            <div className="border-t border-[#1a1a1a] pt-4">
              <p className="text-xs text-[#444]">No digs published yet. Run the dig cron to generate the first one.</p>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <aside className="space-y-8">
          <StatsBar
            tokensExamined={tokensExamined}
            fossilsFound={fossilsFound}
            totalBurned={0}
            lastDigHoursAgo={lastDigHoursAgo}
          />

          <div>
            <div className="text-[10px] text-[#888] tracking-widest mb-4">RECENT FRAGMENTS</div>
            <div>
              {recentFragments.length === 0 ? (
                <p className="text-xs text-[#444]">No fragments yet.</p>
              ) : (
                recentFragments.map(f => <FragmentItem key={f.id} fragment={f} />)
              )}
            </div>
          </div>

          <div className="border-t border-[#1a1a1a] pt-6">
            <p className="text-[10px] text-[#444] italic">every token has a last transaction.</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create `app/digs/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { FilterSidebar, FilterState } from '@/components/filter-sidebar'
import { ArchiveTable } from '@/components/archive-table'
import type { DigRow } from '@/lib/supabase/types'

const DEFAULT_FILTERS: FilterState = {
  causes: ['rug', 'abandonment', 'whale_exit', 'natural_decay', 'unknown'],
  sortBy: 'newest',
}

export default function DigsPage() {
  const [digs, setDigs] = useState<DigRow[]>([])
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabaseBrowser
      .from('digs')
      .select('*')
      .eq('published', true)
      .then(({ data }) => {
        setDigs((data ?? []) as DigRow[])
        setLoading(false)
      })
  }, [])

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-8">
        <Link href="/" className="text-[10px] text-[#444] hover:text-[#888] transition-colors">← home</Link>
        <h1 className="text-sm tracking-[0.3em] text-[#d97706] mt-4 mb-1">THE ARCHIVE</h1>
        <p className="text-xs text-[#888]">{loading ? '...' : `${digs.length} digs`}</p>
      </header>

      <div className="flex gap-8">
        <FilterSidebar filters={filters} onChange={setFilters} />
        <div className="flex-1 min-w-0">
          {loading ? (
            <p className="text-xs text-[#444]">loading...</p>
          ) : (
            <ArchiveTable digs={digs} filters={filters} />
          )}
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create `app/digs/[number]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { DigCard } from '@/components/dig-card'
import { EvidencePanel } from '@/components/evidence-panel'
import type { DigRow } from '@/lib/supabase/types'

export const revalidate = 3600

interface Props {
  params: { number: string }
}

export default async function DigPage({ params }: Props) {
  const digNumber = parseInt(params.number, 10)
  if (isNaN(digNumber)) notFound()

  const supabase = createServerClient()
  const { data } = await supabase
    .from('digs')
    .select('*')
    .eq('dig_number', digNumber)
    .eq('published', true)
    .single()

  if (!data) notFound()

  const dig = data as DigRow
  const evidence = (dig.on_chain_evidence ?? []) as Array<{
    type: string
    hash?: string
    address?: string
    description: string
    solscan_url?: string
  }>

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-8">
        <Link href="/digs" className="text-[10px] text-[#444] hover:text-[#888] transition-colors">← the archive</Link>
      </header>

      <div className="grid grid-cols-[1fr_220px] gap-12">
        <div>
          <DigCard dig={dig} showLink={false} />
        </div>
        <EvidencePanel evidence={evidence} digNumber={dig.dig_number} tokenName={dig.token_name} />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Create `app/fragments/page.tsx`**

```tsx
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { FragmentItem } from '@/components/fragment-item'
import type { FragmentRow } from '@/lib/supabase/types'

export const revalidate = 60

export default async function FragmentsPage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('fragments')
    .select('*')
    .eq('published', true)
    .order('generated_at', { ascending: false })
    .limit(50)

  const fragments = (data ?? []) as FragmentRow[]

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <header className="mb-8">
        <Link href="/" className="text-[10px] text-[#444] hover:text-[#888] transition-colors">← home</Link>
        <h1 className="text-sm tracking-[0.3em] text-[#d97706] mt-4 mb-1">FRAGMENTS</h1>
        <p className="text-xs text-[#888]">{fragments.length} fragments</p>
      </header>

      <div>
        {fragments.length === 0 ? (
          <p className="text-xs text-[#444]">No fragments yet. Run the fragment cron to generate the first one.</p>
        ) : (
          fragments.map(f => <FragmentItem key={f.id} fragment={f} />)
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Add nav links to `app/layout.tsx`** — add a simple nav bar:

In `app/layout.tsx`, wrap `{children}` with:
```tsx
<div>
  <nav className="border-b border-[#1a1a1a] px-6 py-3 flex gap-6 text-[10px] text-[#444]">
    <a href="/" className="hover:text-[#888] transition-colors tracking-widest">THE ARCHAEOLOGIST</a>
    <a href="/digs" className="hover:text-[#888] transition-colors">archive</a>
    <a href="/fragments" className="hover:text-[#888] transition-colors">fragments</a>
  </nav>
  {children}
</div>
```

- [ ] **Step 6: Verify full app renders**

```bash
npm run dev
```

Visit:
- `http://localhost:3000` — homepage loads (may show "no digs yet" if DB is empty)
- `http://localhost:3000/digs` — archive loads
- `http://localhost:3000/fragments` — fragments page loads

- [ ] **Step 7: Run full dig cycle and verify homepage populates**

```bash
curl -X POST http://localhost:3000/api/cron/dig \
  -H "Authorization: Bearer dev-cron-secret"
```

Reload `http://localhost:3000` — homepage should show the generated dig.

- [ ] **Step 8: Run a fragment cycle**

```bash
curl -X POST http://localhost:3000/api/cron/fragment \
  -H "Authorization: Bearer dev-cron-secret"
```

Reload `http://localhost:3000` — fragments sidebar should show a fragment.

- [ ] **Step 9: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 10: Commit**

```bash
git add app/
git commit -m "feat: add all frontend pages (homepage, archive, dig, fragments)"
```

---

## Task 13: Final Wiring + Verification

- [ ] **Step 1: Run all tests**

```bash
npx jest
```
Expected: All PASS.

- [ ] **Step 2: Run seed script against Supabase**

```bash
npm run seed
```
Expected: 10 tokens seeded.

- [ ] **Step 3: Run full dig cycle, confirm dig stored + published**

```bash
curl -X POST http://localhost:3000/api/cron/dig \
  -H "Authorization: Bearer dev-cron-secret" | jq .
```
Expected: `"validation_status": "passed"`, `"success": true`

- [ ] **Step 4: Run fragment cycle, confirm fragment stored + published**

```bash
curl -X POST http://localhost:3000/api/cron/fragment \
  -H "Authorization: Bearer dev-cron-secret" | jq .
```
Expected: `"success": true`, content present.

- [ ] **Step 5: Verify validation flagging works**

Temporarily modify one fixture token to add a hash that doesn't exist in the transactions array. Re-run the dig cycle. Expected: `"validation_status": "flagged"`. Revert the fixture change.

- [ ] **Step 6: Verify all success criteria from spec**

- [ ] `npm run dev` starts with `DATA_PROVIDER=mock` — no API keys needed (except ANTHROPIC + Supabase)
- [ ] Dig cron generates and stores a valid dig
- [ ] Fragment cron generates and stores a valid fragment
- [ ] Validation layer correctly flags a dig with a bad hash
- [ ] Homepage renders latest dig + fragments sidebar
- [ ] Archive renders all digs, filters and sort work correctly
- [ ] Individual dig page renders content + evidence panel
- [ ] Supabase migrations applied cleanly
- [ ] All 10 fixture tokens seeded into `dig_candidates`

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: Phase 1 complete — core engine with mock data pipeline, agent cycle, and frontend"
```
