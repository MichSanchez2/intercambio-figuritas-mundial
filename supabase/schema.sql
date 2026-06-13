-- ============================================================
-- FIGURITAS CARTAGENA — Schema completo
-- Pega este archivo en Supabase → SQL Editor → Run
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLAS
-- ============================================================

create table if not exists listings (
  id                uuid primary key default gen_random_uuid(),
  display_name      text not null,
  contact_type      text not null check (contact_type in ('whatsapp', 'instagram')),
  contact_value     text not null,
  neighborhood      text,
  delivery_cartagena boolean not null default true,
  listing_mode      text not null check (listing_mode in ('TRADE_ONLY', 'SELL_ONLY', 'BOTH')),
  price_type        text not null check (price_type in ('PER_STICKER', 'PER_LOT', 'NEGOTIABLE', 'NOT_APPLICABLE')),
  price_cop         integer,
  notes             text,
  status            text not null default 'ACTIVE' check (status in ('ACTIVE', 'CLOSED', 'HIDDEN', 'EXPIRED')),
  edit_token_hash   text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  expires_at        timestamptz not null default (now() + interval '15 days')
);

create table if not exists offered_stickers (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listings(id) on delete cascade,
  category_code   text not null,
  category_label  text not null,
  sticker_number  integer not null,
  status          text not null default 'AVAILABLE' check (status in ('AVAILABLE', 'TRADED', 'SOLD')),
  price_cop       integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (listing_id, category_code, sticker_number)
);

create table if not exists wanted_stickers (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listings(id) on delete cascade,
  category_code   text not null,
  category_label  text not null,
  sticker_number  integer not null,
  created_at      timestamptz not null default now(),
  unique (listing_id, category_code, sticker_number)
);

create table if not exists moderation_log (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid,
  action      text not null,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists idx_listings_status         on listings(status);
create index if not exists idx_listings_expires_at     on listings(expires_at);
create index if not exists idx_listings_mode           on listings(listing_mode);
create index if not exists idx_listings_neighborhood   on listings(neighborhood);
create index if not exists idx_offered_listing_id      on offered_stickers(listing_id);
create index if not exists idx_offered_category_code   on offered_stickers(category_code);
create index if not exists idx_offered_sticker_number  on offered_stickers(sticker_number);
create index if not exists idx_offered_status          on offered_stickers(status);
create index if not exists idx_wanted_listing_id       on wanted_stickers(listing_id);
create index if not exists idx_wanted_category_code    on wanted_stickers(category_code);

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_listings_updated_at
  before update on listings
  for each row execute function set_updated_at();

create trigger trg_offered_updated_at
  before update on offered_stickers
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table listings           enable row level security;
alter table offered_stickers   enable row level security;
alter table wanted_stickers    enable row level security;
alter table moderation_log     enable row level security;

-- Bloquear toda escritura directa desde el navegador (anon / authenticated)
-- Todas las escrituras van por Edge Functions con service_role.

-- Lectura pública de listings activos y no vencidos
create policy "public_read_active_listings"
  on listings for select
  using (
    status = 'ACTIVE'
    and expires_at > now()
  );

-- Lectura pública de figuritas AVAILABLE de listings activos
create policy "public_read_available_stickers"
  on offered_stickers for select
  using (
    status = 'AVAILABLE'
    and exists (
      select 1 from listings l
      where l.id = offered_stickers.listing_id
        and l.status = 'ACTIVE'
        and l.expires_at > now()
    )
  );

-- Lectura pública de faltantes de listings activos
create policy "public_read_wanted_stickers"
  on wanted_stickers for select
  using (
    exists (
      select 1 from listings l
      where l.id = wanted_stickers.listing_id
        and l.status = 'ACTIVE'
        and l.expires_at > now()
    )
  );

-- Sin acceso público al log de moderación
create policy "no_public_moderation_log"
  on moderation_log for select
  using (false);

-- ============================================================
-- VISTA PÚBLICA: public_stickers
-- Une figuritas con datos mínimos del listing para el catálogo
-- ============================================================

create or replace view public_stickers as
select
  os.id           as sticker_id,
  os.listing_id,
  os.category_code,
  os.category_label,
  os.sticker_number,
  l.display_name,
  l.contact_type,
  l.contact_value,
  l.neighborhood,
  l.listing_mode,
  l.price_type,
  l.price_cop,
  l.notes,
  l.expires_at
from offered_stickers os
join listings l on l.id = os.listing_id
where
  os.status = 'AVAILABLE'
  and l.status = 'ACTIVE'
  and l.expires_at > now();

-- ============================================================
-- FUNCIÓN SQL: verify_edit_token
-- Usada internamente por las Edge Functions
-- ============================================================

create or replace function verify_edit_token(p_id uuid, p_token_hash text)
returns boolean
language sql security definer as $$
  select exists (
    select 1 from listings
    where id = p_id
      and edit_token_hash = p_token_hash
      and status != 'CLOSED'
  );
$$;
