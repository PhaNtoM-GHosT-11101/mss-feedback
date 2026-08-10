-- Seed the actual NIT Agartala messes and retire the placeholder
insert into messes (name, is_active) values
  ('Eastern', true),
  ('Northern', true),
  ('Gargi', true)
on conflict (name) do update set is_active = true;

update messes set is_active = false where name = 'Main Mess';
