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

create index idx_digs_published on digs(published, generated_at desc);
create index idx_digs_cause on digs(cause_of_death);
create index idx_fragments_published on fragments(published, generated_at desc);
create index idx_candidates_status_score on dig_candidates(status, score desc);
create index idx_memory_cycle on agent_memory(cycle_number desc);
