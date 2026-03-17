alter table digs enable row level security;
alter table fragments enable row level security;
alter table nominations enable row level security;
alter table confessions enable row level security;
alter table burn_events enable row level security;
alter table fossils enable row level security;
alter table dig_candidates enable row level security;
alter table agent_memory enable row level security;

create policy "public read published digs"
  on digs for select to anon
  using (published = true);

create policy "public read published fragments"
  on fragments for select to anon
  using (published = true);

create policy "public read nominations"
  on nominations for select to anon using (true);

create policy "public insert nominations"
  on nominations for insert to anon with check (true);

create policy "public insert confessions"
  on confessions for insert to anon with check (true);

create policy "public read fossils"
  on fossils for select to anon using (true);

create policy "public read burn events"
  on burn_events for select to anon using (true);
