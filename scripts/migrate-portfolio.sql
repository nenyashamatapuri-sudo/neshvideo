-- Portfolio CMS schema, v2.
--
-- Adds the fields the section and detail pages need: a URL slug, credits,
-- a gallery of stills, and an explicit running order. Safe to run more than
-- once — every statement guards itself.

-- ---------------------------------------------------------------- columns --

alter table portfolio_pieces add column if not exists slug        text;
alter table portfolio_pieces add column if not exists client      text;
alter table portfolio_pieces add column if not exists agency      text;
alter table portfolio_pieces add column if not exists images      jsonb   not null default '[]'::jsonb;
alter table portfolio_pieces add column if not exists coming_soon boolean not null default false;
alter table portfolio_pieces add column if not exists sort_order  integer not null default 0;

-- Backfill slugs for any rows added before this migration, then lock the
-- column down. Two pieces may share a title across sections but not within one.
update portfolio_pieces
   set slug = regexp_replace(lower(trim(title)), '[^a-z0-9]+', '-', 'g')
 where slug is null or slug = '';

update portfolio_pieces p
   set slug = p.slug || '-' || substr(p.id::text, 1, 4)
  from (
    select id, row_number() over (partition by category, slug order by created_at) as n
      from portfolio_pieces
  ) d
 where d.id = p.id and d.n > 1;

alter table portfolio_pieces alter column slug set not null;

create unique index if not exists portfolio_pieces_category_slug_key
  on portfolio_pieces (category, slug);

create index if not exists portfolio_pieces_category_order_idx
  on portfolio_pieces (category, sort_order);

-- ------------------------------------------------------------ table rules --

alter table portfolio_pieces enable row level security;

drop policy if exists "Allow public reads"   on portfolio_pieces;
drop policy if exists "Allow public inserts" on portfolio_pieces;
drop policy if exists "Allow public updates" on portfolio_pieces;
drop policy if exists "Allow public deletes" on portfolio_pieces;

create policy "Allow public reads"   on portfolio_pieces for select using (true);
create policy "Allow public inserts" on portfolio_pieces for insert with check (true);
create policy "Allow public updates" on portfolio_pieces for update using (true) with check (true);
create policy "Allow public deletes" on portfolio_pieces for delete using (true);

-- ---------------------------------------------------------------- storage --

-- The bucket the CMS uploads stills into. Public, so next/image can read it.
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

-- Without these the upload endpoint fails with
-- "new row violates row-level security policy".
drop policy if exists "portfolio_insert" on storage.objects;
drop policy if exists "portfolio_select" on storage.objects;
drop policy if exists "portfolio_update" on storage.objects;
drop policy if exists "portfolio_delete" on storage.objects;

create policy "portfolio_insert" on storage.objects for insert with check (bucket_id = 'portfolio');
create policy "portfolio_select" on storage.objects for select using      (bucket_id = 'portfolio');
create policy "portfolio_update" on storage.objects for update using      (bucket_id = 'portfolio');
create policy "portfolio_delete" on storage.objects for delete using      (bucket_id = 'portfolio');
