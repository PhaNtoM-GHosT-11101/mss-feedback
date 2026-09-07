-- 19: make global search fast. Both ILIKE '%term%' filters (title/description)
-- were full-table scans; a trigram GIN index turns them into index scans.

create extension if not exists pg_trgm;

create index if not exists complaint_search_title_trgm
  on public.complaints using gin (title gin_trgm_ops);

create index if not exists complaint_search_description_trgm
  on public.complaints using gin (description gin_trgm_ops);