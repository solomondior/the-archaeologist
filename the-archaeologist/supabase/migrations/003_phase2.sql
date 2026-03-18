-- Allow service role to update nomination votes
create policy "service role update nominations"
  on nominations for update to service_role
  using (true)
  with check (true);

-- Allow service role to read confessions (for agent to reference in digs)
create policy "service role read confessions"
  on confessions for select to service_role
  using (true);

create index idx_nominations_status_votes on nominations(status, votes desc);
create index idx_fossils_wallet on fossils(wallet_address);
create index idx_fossils_dig on fossils(discovered_in_dig);
