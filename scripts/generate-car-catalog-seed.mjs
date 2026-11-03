// Gera supabase/seed.sql a partir de supabase/seed-data/car-models.json.
// Rodar: node scripts/generate-car-catalog-seed.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataPath = path.join(rootDir, "supabase", "seed-data", "car-models.json");
const outPath = path.join(rootDir, "supabase", "seed.sql");

const { models } = JSON.parse(readFileSync(dataPath, "utf-8"));

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const values = models
  .map(
    (m) =>
      `  (${sqlString(m.brand)}, ${sqlString(m.model)}, ${m.yearFrom}, ${m.yearTo}, ${sqlString(m.fuelType)}, ${m.consumptionCombinedKml})`
  )
  .join(",\n");

const sql = `-- Gerado automaticamente por scripts/generate-car-catalog-seed.mjs
-- Fonte editável: supabase/seed-data/car-models.json
truncate table public.car_models_catalog;

insert into public.car_models_catalog
  (brand, model, year_from, year_to, fuel_type, consumption_combined_kml)
values
${values};
`;

writeFileSync(outPath, sql, "utf-8");
console.log(`Gerado ${outPath} com ${models.length} modelos.`);
