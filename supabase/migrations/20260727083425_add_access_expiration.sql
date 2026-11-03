-- Modelo de negócio: pagamento único dá acesso por 1 ano (não mais vitalício).
alter table public.profiles
  add column access_expires_at timestamptz not null default (now() + interval '1 year');

comment on column public.profiles.access_expires_at is
  'Acesso expira 1 ano após a compra (ou reemissão/renovação via webhook da Kiwify).';
