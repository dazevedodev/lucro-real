"use client";

import { useActionState, useMemo, useState } from "react";
import { saveCar, type CarFormState } from "./actions";
import type { Database } from "@/lib/supabase/database.types";

type CatalogRow = Database["public"]["Tables"]["car_models_catalog"]["Row"];
type UserCarRow = Database["public"]["Tables"]["user_cars"]["Row"];

const initialState: CarFormState = {};

export default function CarForm({
  catalog,
  existingCar,
}: {
  catalog: CatalogRow[];
  existingCar: UserCarRow | null;
}) {
  const [state, formAction, pending] = useActionState(saveCar, initialState);

  const brands = useMemo(
    () => Array.from(new Set(catalog.map((c) => c.brand))).sort(),
    [catalog]
  );

  const [brand, setBrand] = useState(existingCar?.brand ?? "");
  const modelsForBrand = useMemo(
    () => Array.from(new Set(catalog.filter((c) => c.brand === brand).map((c) => c.model))).sort(),
    [catalog, brand]
  );

  const [model, setModel] = useState(existingCar?.model ?? "");
  const catalogEntry = useMemo(
    () => catalog.find((c) => c.brand === brand && c.model === model) ?? null,
    [catalog, brand, model]
  );

  const yearOptions = useMemo(() => {
    if (!catalogEntry) return [];
    const years: number[] = [];
    for (let y = catalogEntry.year_to; y >= catalogEntry.year_from; y--) years.push(y);
    return years;
  }, [catalogEntry]);

  const [year, setYear] = useState(existingCar?.year?.toString() ?? "");
  const [consumptionKml, setConsumptionKml] = useState(
    existingCar?.consumption_kml?.toString() ?? ""
  );
  const [maintenanceCostPerKm, setMaintenanceCostPerKm] = useState(
    existingCar?.maintenance_cost_per_km?.toString() ?? "0.15"
  );

  function handleModelChange(newModel: string) {
    setModel(newModel);
    const entry = catalog.find((c) => c.brand === brand && c.model === newModel);
    if (entry) {
      setConsumptionKml(entry.consumption_combined_kml.toString());
      setYear(entry.year_to.toString());
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="carId" value={existingCar?.id ?? ""} />
      <input type="hidden" name="catalogId" value={catalogEntry?.id ?? ""} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300">Marca</label>
          <select
            name="brand"
            required
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setModel("");
            }}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
          >
            <option value="">Selecione</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Modelo</label>
          <select
            name="model"
            required
            value={model}
            disabled={!brand}
            onChange={(e) => handleModelChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white disabled:opacity-50"
          >
            <option value="">Selecione</option>
            {modelsForBrand.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300">Ano</label>
          {yearOptions.length > 0 ? (
            <select
              name="year"
              required
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
            >
              <option value="">Selecione</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          ) : (
            <input
              name="year"
              type="number"
              required
              min={1990}
              max={new Date().getFullYear() + 1}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300">Consumo (km/l)</label>
          <input
            name="consumptionKml"
            type="number"
            step="0.1"
            min="1"
            required
            value={consumptionKml}
            onChange={(e) => setConsumptionKml(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Sugerido automaticamente pelo modelo selecionado — edite se o consumo real do seu
            carro for diferente.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300">
          Custo de manutenção estimado (R$/km)
        </label>
        <input
          name="maintenanceCostPerKm"
          type="number"
          step="0.01"
          min="0"
          required
          value={maintenanceCostPerKm}
          onChange={(e) => setMaintenanceCostPerKm(e.target.value)}
          className="mt-1 w-full max-w-[10rem] rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Valor médio de mercado por km rodado (desgaste, óleo, pneus etc). Editável.
        </p>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-400">Carro salvo com sucesso.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar carro"}
      </button>
    </form>
  );
}
