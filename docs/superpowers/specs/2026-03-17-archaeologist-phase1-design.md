# The Archaeologist — Phase 1: Core Engine
**Date:** 2026-03-17
**Status:** Approved for implementation
**Scope:** Phase 1 of 4

---

## Overview

The Archaeologist is an autonomous AI agent that crawls Solana's memecoin history and surfaces forgotten tokens, dead communities, and dormant wallets. It narrates these finds like a documentary filmmaker — investigative, precise, never mocking. Every story is verifiable on-chain.

**Tagline:** *every token has a last transaction.*

Phase 1 delivers the core engine: the on-chain data pipeline (with mock data), the Claude-powered agent generation cycle, and the public-facing frontend (homepage, archive, individual dig pages, fragments feed).

---

## What Is Out of Scope for Phase 1

The following are deferred to later phases:

- **Phase 2:** Community nominations, Confession Booth, voting, Wall of Fossils
- **Phase 3:** Actual Solana RELIC burn transactions, treasury wallet, `/witness` page
- **Phase 4:** X/Twitter auto-posting, admin panel, recurring series (Last Buyer, Cause of Death, Still Holding)

---

## Tech Stack

```
Framework:        Next.js 14+ (App Router)
Language:         TypeScript
Styling:          Tailwind CSS
Font:             Geist Mono throughout
Deployment:       Vercel
Cron:             Vercel Cron Jobs
Database:         Supabase (PostgreSQL)
AI:               Anthropic — claude-sonnet-4-6
Auth:             None (Phase 1 has no protected routes)
```

---

## Architecture

### Adapter Pattern — DataProvider

All agent and scoring logic is decoupled from on-chain data sources via a `DataProvider` interface. The active implementation is controlled by:

```
DATA_PROVIDER=mock   # uses MockDataProvider (fixture JSON)
DATA_PROVIDER=live   # routes to Helius/Birdeye/Solscan (Phase 2+)
```

This means Phase 1 runs fully without any API keys. Swapping to live data requires no changes to agent code.

### Three Pillars

```
① DATA PIPELINE          ② AGENT CYCLE             ③ FRONTEND
─────────────────        ──────────────────        ──────────────────
DataProvider interface   Vercel Cron (24h dig)     Next.js App Router
└─ MockDataProvider      Vercel Cron (6h frag)     / homepage
└─ LiveProvider (later)  ContextBuilder            /digs archive
                         DigGenerator (Claude)     /digs/[number]
CandidateScorer          FragmentGenerator         /fragments
└─ PRD scoring formula   ValidationLayer
└─ writes to DB          MemoryManager
                         → Supabase
```

### Data Flow — Dig Cycle

```
Cron fires
  → fetch top-scored candidate from dig_candidates
  → DataProvider.getToken*(address)         ← all data fetch here
  → ContextBuilder.build(tokenData, memory) ← assembles Claude prompt
  → DigGenerator.generate(context)          ← calls Claude, parses output
  → ValidationLayer.verify(dig)             ← checks all cited hashes
  → if passed:  INSERT dig (published=true, validation_status='passed')
  → if flagged: INSERT dig (published=false, validation_status='flagged')
  → MemoryManager.compress(cycle)           ← stores summary for next cycle
```

### Data Flow — Fragment Cycle

```
Cron fires
  → DataProvider.getRecentAnomalies()
  → select highest-signal anomaly
  → FragmentGenerator.generate(anomaly, recentFragments)
  → INSERT fragment (published=true)
```

---

## Project Structure

```
the-archaeologist/
├── app/
│   ├── page.tsx                        # Homepage
│   ├── digs/
│   │   ├── page.tsx                    # Archive — searchable, filterable
│   │   └── [number]/
│   │       └── page.tsx                # Individual dig
│   ├── fragments/
│   │   └── page.tsx                    # Fragment feed
│   └── api/
│       ├── cron/
│       │   ├── dig/route.ts            # POST — 24h dig cycle
│       │   └── fragment/route.ts       # POST — 6h fragment cycle
│       └── health/route.ts
├── lib/
│   ├── data-provider/
│   │   ├── types.ts                    # DataProvider interface + all shared types
│   │   ├── mock.ts                     # MockDataProvider (fixture-backed)
│   │   └── index.ts                    # factory — returns mock or live
│   ├── agent/
│   │   ├── context-builder.ts          # builds Claude context payload per cycle
│   │   ├── dig-generator.ts            # calls Claude, returns structured Dig
│   │   ├── fragment-generator.ts       # calls Claude, returns Fragment
│   │   ├── validator.ts                # verifies tx hashes before publish
│   │   └── memory.ts                   # compresses + stores agent memory
│   ├── scoring/
│   │   └── candidate-scorer.ts         # scores dig_candidates by PRD formula
│   └── supabase/
│       ├── client.ts                   # typed browser client
│       ├── server.ts                   # typed server client (service role)
│       └── types.ts                    # generated DB types
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_rls_policies.sql
├── fixtures/
│   └── tokens/                         # 10 mock dead token JSON files
├── components/
│   ├── dig-card.tsx
│   ├── fragment-item.tsx
│   ├── stats-bar.tsx
│   ├── archive-table.tsx
│   ├── filter-sidebar.tsx
│   └── evidence-panel.tsx
└── vercel.json                          # cron schedule config
```

---

## DataProvider Interface

```typescript
interface DataProvider {
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
```

`MockDataProvider` implements this fully. All fixture token files include:
- Token metadata with valid Solana-format addresses (base58, 32–44 chars)
- Realistic price/holder history
- Dev wallet drain events (for rug scenarios)
- Transaction hashes that validate correctly within mock context
- Mix of causes: rug, abandonment, whale exit, natural decay, unknown

The mock validator returns `true` for any hash that appears in the fixture data for the current token, `false` otherwise — simulating real validation behaviour without hitting Solscan.

---

## Agent Cycle Detail

### System Prompt Structure

The Claude system prompt is built fresh each cycle and includes (in order):

1. **Agent identity block** — voice guidelines: investigative, documentary, never mocking, comfortable with ambiguity
2. **Constraint block** — hard rule: only cite transaction hashes and addresses that appear verbatim in the provided context payload. Fabrication is prohibited.
3. **Archive summary** — current dig number, tokens already covered (deduplication)
4. **Last 5 dig summaries** — compressed, for consistency of voice
5. **Target token data** — full structured JSON from DataProvider
6. **Output format instruction** — structured dig with exactly the PRD sections: `what it was`, `what happened`, `what remains`, `what the archaeologist thinks`, `on-chain evidence`

### Dig Output Schema

```typescript
interface GeneratedDig {
  token_name: string
  token_address: string
  launch_date: string
  death_date: string
  peak_market_cap: number
  peak_holder_count: number
  cause_of_death: 'rug' | 'abandonment' | 'whale_exit' | 'natural_decay' | 'unknown'
  content: {
    what_it_was: string
    what_happened: string
    what_remains: string
    archaeologist_thinks: string
  }
  on_chain_evidence: Array<{
    type: string
    hash: string
    address: string
    description: string
    solscan_url: string
  }>
}
```

### Validation Layer

Before any dig is marked `published=true`:
- Every `hash` in `on_chain_evidence` is passed to `DataProvider.verifyTransactionHash()`
- Every `address` is passed to `DataProvider.verifyWalletAddress()`
- If all pass: `validation_status = 'passed'`, `published = true`
- If any fail: `validation_status = 'flagged'`, `published = false`
- Flagged digs are stored for manual review (Phase 4 admin panel)

### Candidate Scoring Formula

```
score = (
  (log10(peak_market_cap) * 20) +
  (peak_holder_count * 0.01) +
  (days_since_last_tx * 0.5) +
  (nomination_votes * 5) +
  (rug_confirmed ? 30 : 0) +
  (unusual_patterns ? 20 : 0) +
  (confession_mentions * 10)
)
```

In Phase 1, `nomination_votes` and `confession_mentions` are always 0. `unusual_patterns` is set from fixture data flags.

---

## Database Schema

All migrations delivered as numbered `.sql` files, applicable to any fresh Supabase project.

### Tables

**`digs`**
```sql
id uuid primary key default gen_random_uuid(),
dig_number integer unique not null,
token_name text not null,
token_address text,
launch_date timestamptz,
death_date timestamptz,
peak_market_cap numeric,
peak_holder_count integer,
cause_of_death text,           -- 'rug' | 'abandonment' | 'whale_exit' | 'natural_decay' | 'unknown'
content text not null,
on_chain_evidence jsonb,       -- array of {type, hash, address, description, solscan_url}
raw_context jsonb,             -- full context payload sent to Claude (debug + replay)
validation_status text default 'pending',  -- 'pending' | 'passed' | 'flagged'
generated_at timestamptz default now(),
phase text,                    -- 'standard' in Phase 1
published boolean default false
```

**`fragments`**
```sql
id uuid primary key default gen_random_uuid(),
content text not null,
source_wallet text,
source_token text,
anomaly_type text,             -- 'dormancy' | 'rug_pattern' | 'consecutive_losses' | 'last_buyer' | 'other'
generated_at timestamptz default now(),
published boolean default false
```

**`nominations`** *(schema only in Phase 1 — UI in Phase 2)*
```sql
id uuid primary key default gen_random_uuid(),
token_address text not null,
token_name text,
reason text,
submitter_wallet text,
votes integer default 0,
status text default 'pending',
burn_tx text,
submitted_at timestamptz default now()
```

**`confessions`** *(schema only in Phase 1 — UI in Phase 2)*
```sql
id uuid primary key default gen_random_uuid(),
content text not null,
used_in_dig uuid references digs(id),
submitted_at timestamptz default now()
```

**`burn_events`** *(schema only in Phase 1 — logic in Phase 3)*
```sql
id uuid primary key default gen_random_uuid(),
trigger_type text not null,
trigger_reference uuid,
amount_burned numeric not null,
supply_before numeric not null,
supply_after numeric not null,
transaction_hash text not null,
burned_at timestamptz default now()
```

**`fossils`** *(schema only in Phase 1 — UI in Phase 2)*
```sql
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
discovered_at timestamptz default now()
```

**`dig_candidates`**
```sql
id uuid primary key default gen_random_uuid(),
token_address text not null,
token_name text,
token_name_raw text,           -- name as returned from source before normalization
score numeric default 0,
score_breakdown jsonb,
status text default 'candidate',  -- 'candidate' | 'queued' | 'completed' | 'skipped'
added_at timestamptz default now()
```

**`agent_memory`**
```sql
id uuid primary key default gen_random_uuid(),
cycle_number integer not null,
cycle_type text not null,      -- 'dig' | 'fragment'
tokens_covered text[],
memory_summary text,
created_at timestamptz default now()
```

### RLS Policies

- `digs`: public SELECT (where `published = true`), service role all
- `fragments`: public SELECT (where `published = true`), service role all
- `dig_candidates`: service role only
- `agent_memory`: service role only
- `nominations`: public SELECT + INSERT, service role all
- `confessions`: public INSERT only (no SELECT), service role all
- `fossils`: public SELECT, service role all
- `burn_events`: public SELECT, service role all

---

## Frontend Design

### Visual System

```
Background:   #0a0a0a
Body text:    #e8e8e8
Muted text:   #888888
Accent:       #d97706 (amber) — key data, citations, burn events only
Font:         Geist Mono — monospace throughout
Borders:      #1a1a1a or #2a2a2a
No gradients. No glassmorphism. No rounded containers.
```

### Pages

**`/` — Homepage**

Two-column layout:
- Left (wider): latest dig — full content rendered with all PRD sections
- Right sidebar: live stats bar (tokens examined, fossils found, total burned, last dig), recent fragments feed (last 6), tagline at bottom: *every token has a last transaction.*

**`/digs` — Archive**

Two-column layout:
- Left sidebar: filter controls — cause of death checkboxes, peak market cap range slider, days dormant range, sort selector (newest/oldest/highest peak cap/most holders)
- Right: compact table — columns: dig number (amber), token name, launch→death dates, cause badge, peak market cap, holder count. Click row → `/digs/[number]`

**`/digs/[number]` — Individual Dig**

Two-column layout:
- Left (wider): dig header (number, token name, date range, stats row), then structured content sections with amber section labels (`WHAT IT WAS`, `WHAT HAPPENED`, `WHAT REMAINS`, `WHAT THE ARCHAEOLOGIST THINKS`)
- Right panel: `EVIDENCE` — each cited hash truncated (first 4...last 3 chars), description, Solscan link in amber. Below evidence: share to X button, "nominate a related token" link (disabled in Phase 1)

**`/fragments` — Fragment Feed**

Single column. Chronological list of fragments. Each fragment: timestamp, content, source token/wallet if available. No pagination in Phase 1 — load last 50.

### Cron Configuration (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/dig",      "schedule": "0 12 * * *"  },
    { "path": "/api/cron/fragment", "schedule": "0 6,12,18,0 * * *" }
  ]
}
```

Cron routes validate `Authorization: Bearer {CRON_SECRET}` header before executing.

---

## Environment Variables

```env
# Anthropic
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Data pipeline
DATA_PROVIDER=mock              # 'mock' | 'live'

# Blockchain data (live mode only — not needed for Phase 1)
HELIUS_API_KEY=
BIRDEYE_API_KEY=
SOLSCAN_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
CRON_SECRET=                    # validates cron route calls
```

---

## Key Constraints

- **No fabricated data.** The validation layer enforces this at the pipeline level, not just the prompt level. A dig with an unverifiable hash never publishes.
- **No mocking loss.** Voice guidelines are in the system prompt. Documentary, not derisive.
- **No price predictions or RELIC commentary.** Out of agent scope.
- **Daily digs are non-negotiable.** The cron must fire. Missed digs are tracked in `agent_memory` for debugging.
- **Every table in scope has its schema created in Phase 1** even if the UI ships in a later phase. This ensures migrations are clean and additive, never destructive.

---

## Mock Fixture Tokens (10 required)

Each fixture covers a different cause of death and story pattern:

| # | Token Name | Cause | Peak MCap | Story Hook |
|---|---|---|---|---|
| 1 | COPETOKEN | rug | $1.2M | Classic 30-day drain |
| 2 | MOONRAT | abandonment | $340K | Dev went silent, community held 6 months |
| 3 | HAROLD | rug | $4.8M | Largest single loss, last buyer still holding |
| 4 | DUSTBUNNY | unknown | $89K | Never traded after week 2, origin unclear |
| 5 | WIZARDHAT | whale_exit | $2.1M | Three wallets held 60%, exited same hour |
| 6 | SOLGHOST | natural_decay | $180K | Slow bleed over 8 months, no single event |
| 7 | PEPEHANDS | rug | $6.3M | Highest peak in fixture set |
| 8 | VAPORCAT | abandonment | $520K | Active community, dev never returned |
| 9 | RUGMASTER | rug | $950K | Ironically named, rugged on day 14 |
| 10 | FINALFORM | whale_exit | $3.4M | Coordinated multi-wallet exit |

---

## Success Criteria for Phase 1

- [ ] `npm run dev` starts with `DATA_PROVIDER=mock` — no API keys needed
- [ ] Dig cron endpoint generates and stores a valid dig using Claude + mock data
- [ ] Fragment cron endpoint generates and stores a valid fragment
- [ ] Validation layer correctly flags a dig when a hash is not in fixture data
- [ ] Homepage renders latest dig + fragments sidebar
- [ ] Archive renders all digs, filters and sort work correctly
- [ ] Individual dig page renders content + evidence panel with Solscan links
- [ ] Supabase migrations apply cleanly to a fresh project
- [ ] All 10 fixture tokens scored and seeded into `dig_candidates` on first run
