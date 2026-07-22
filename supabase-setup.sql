alter table public.properties enable row level security;
alter table public.properties add column if not exists listing_type text default 'For Sale';

drop policy if exists "Public can view approved properties" on public.properties;
create policy "Public can view approved properties"
on public.properties for select
to anon, authenticated
using (status = 'approved' or agent_id = auth.uid());

drop policy if exists "Agents can create own pending properties" on public.properties;
create policy "Agents can create own pending properties"
on public.properties for insert
to authenticated
with check (agent_id = auth.uid() and status = 'pending');

drop policy if exists "Agents can update own pending properties" on public.properties;
create policy "Agents can update own pending properties"
on public.properties for update
to authenticated
using (agent_id = auth.uid() and status = 'pending')
with check (agent_id = auth.uid() and status = 'pending');

drop policy if exists "Public can view property images" on storage.objects;
create policy "Public can view property images"
on storage.objects for select
to public
using (bucket_id = 'property-images');

drop policy if exists "Agents can upload own property images" on storage.objects;
create policy "Agents can upload own property images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
