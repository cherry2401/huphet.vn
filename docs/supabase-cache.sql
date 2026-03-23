create table if not exists public.site_cache (
  cache_key text primary key,
  kind text not null,
  page_url text not null,
  generated_at timestamptz not null default now(),
  payload jsonb not null
);

create index if not exists site_cache_kind_page_url_idx
  on public.site_cache (kind, page_url);

create index if not exists site_cache_kind_page_url_generated_at_idx
  on public.site_cache (kind, page_url, generated_at desc);

-- Cache key convention:
-- microsite:{pageUrl}
-- deals:{pageUrl}
-- deals:{pageUrl}:{slot}
--
-- Vi du:
-- microsite:shopee-sieu-re
-- deals:shopee-sieu-re
-- deals:shopee-sieu-re:0900
