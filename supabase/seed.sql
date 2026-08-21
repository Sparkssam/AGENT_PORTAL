-- Lookup seeds for Kinetic V1. Run after the init migration.
-- Do not insert auth.users here. Create the first admin in the Auth dashboard
-- (or via signUp), then promote:
--   update public.profiles
--      set role = 'admin', title = 'Super Administrator', initials = 'AU'
--    where email = 'admin@kinetic.co.tz';

insert into public.channels (name, code, active) values
  ('M-Pesa', 'mpesa', true),
  ('Tigo Pesa', 'tigo_pesa', true),
  ('Airtel Money', 'airtel_money', true)
on conflict (code) do nothing;

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

insert into public.document_types (code, name, required, allowed_mime, max_size_bytes, sort_order) values
  ('id_front', 'ID Card Front', true, array['image/jpeg', 'image/png', 'application/pdf']::text[], 10485760, 10),
  ('id_back', 'ID Card Back', true, array['image/jpeg', 'image/png', 'application/pdf']::text[], 10485760, 20),
  ('tin', 'TIN Document', true, array['image/jpeg', 'image/png', 'application/pdf']::text[], 10485760, 30),
  ('portrait', 'Portrait', true, array['image/jpeg', 'image/png']::text[], 10485760, 40),
  ('shop_image', 'Shop Image', true, array['image/jpeg', 'image/png']::text[], 10485760, 50),
  ('contract', 'Agreement Contract', true, array['application/pdf']::text[], 20971520, 60),
  ('licence', 'Business Licence', false, array['image/jpeg', 'image/png', 'application/pdf']::text[], 10485760, 70),
  ('other', 'Other', false, array['image/jpeg', 'image/png', 'application/pdf']::text[], 10485760, 80),
  ('deposit_proof', 'Deposit Proof', false, array['image/jpeg', 'image/png', 'application/pdf']::text[], 10485760, 90)
on conflict (code) do nothing;
