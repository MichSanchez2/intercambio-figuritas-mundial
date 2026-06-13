-- ============================================================
-- MIGRACIÓN: Colombia-wide + envíos
-- Pega esto en Supabase → SQL Editor → Run
-- ============================================================

-- Agregar columna ciudad (reemplaza delivery_cartagena)
alter table listings add column if not exists city text;
alter table listings add column if not exists accepts_shipping boolean not null default false;

-- Índice por ciudad para filtros rápidos
create index if not exists idx_listings_city on listings(city);

-- Actualizar vista pública para incluir city y accepts_shipping
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
  l.city,
  l.neighborhood,
  l.accepts_shipping,
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
