-- Replace retail demo sectors with the operational business-sector list.
-- Keep old codes inactive so existing applications keep their foreign keys.

update public.business_sectors
set active = false
where code in ('retail_kiosk', 'supermarket', 'pharmacy', 'wholesale');

insert into public.business_sectors (name, code, active) values
  ('All', 'all', true),
  ('Accommodation and meals', 'accommodation_meals', true),
  ('Administration support service', 'administration_support', true),
  ('Art, play, entertainment', 'art_play_entertainment', true),
  ('Education', 'education', true),
  ('Finance, banking, insurance', 'finance_banking_insurance', true),
  ('Medical', 'medical', true),
  ('Other services', 'other_services', true),
  ('Telecommunication', 'telecommunication', true)
on conflict (code) do update
set name = excluded.name,
    active = true;
