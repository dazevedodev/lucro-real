-- Gerado automaticamente por scripts/generate-car-catalog-seed.mjs
-- Fonte editável: supabase/seed-data/car-models.json
truncate table public.car_models_catalog;

insert into public.car_models_catalog
  (brand, model, year_from, year_to, fuel_type, consumption_combined_kml)
values
  ('Chevrolet', 'Onix', 2020, 2024, 'gasolina', 12.5),
  ('Chevrolet', 'Onix Plus', 2020, 2024, 'gasolina', 12.3),
  ('Chevrolet', 'Prisma', 2013, 2019, 'gasolina', 11.8),
  ('Chevrolet', 'Cobalt', 2012, 2019, 'gasolina', 11.5),
  ('Chevrolet', 'Spin', 2013, 2022, 'gasolina', 10.5),
  ('Volkswagen', 'Gol', 2015, 2023, 'gasolina', 11.5),
  ('Volkswagen', 'Voyage', 2015, 2023, 'gasolina', 11.3),
  ('Volkswagen', 'Fox', 2010, 2019, 'gasolina', 11.5),
  ('Volkswagen', 'Polo', 2018, 2024, 'gasolina', 12.5),
  ('Volkswagen', 'Virtus', 2018, 2024, 'gasolina', 12.3),
  ('Fiat', 'Palio', 2010, 2017, 'gasolina', 11),
  ('Fiat', 'Siena', 2010, 2016, 'gasolina', 11.2),
  ('Fiat', 'Mobi', 2017, 2023, 'gasolina', 14),
  ('Fiat', 'Argo', 2018, 2023, 'gasolina', 13),
  ('Fiat', 'Cronos', 2019, 2023, 'gasolina', 12.8),
  ('Ford', 'Ka', 2015, 2021, 'gasolina', 13),
  ('Ford', 'Fiesta', 2011, 2019, 'gasolina', 12),
  ('Renault', 'Sandero', 2015, 2023, 'gasolina', 11.5),
  ('Renault', 'Logan', 2015, 2023, 'gasolina', 11.3),
  ('Renault', 'Kwid', 2018, 2023, 'gasolina', 14.5),
  ('Hyundai', 'HB20', 2019, 2024, 'gasolina', 13),
  ('Hyundai', 'HB20S', 2019, 2024, 'gasolina', 12.8),
  ('Toyota', 'Etios', 2013, 2021, 'gasolina', 13.5),
  ('Honda', 'Fit', 2015, 2021, 'gasolina', 12.5),
  ('Nissan', 'Versa', 2020, 2024, 'gasolina', 13),
  ('Nissan', 'March', 2014, 2020, 'gasolina', 12.8),
  ('Citroën', 'C3', 2013, 2020, 'gasolina', 11.5),
  ('Peugeot', '208', 2013, 2020, 'gasolina', 12);
