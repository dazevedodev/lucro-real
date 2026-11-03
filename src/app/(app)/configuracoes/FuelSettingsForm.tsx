"use client";

import { useActionState } from "react";
import { saveFuelSettings, type FuelSettingsState } from "./actions";
import type { FuelType } from "@/lib/supabase/database.types";

const initialState: FuelSettingsState = {};

export default function FuelSettingsForm({
  fuelType,
  fuelPrice,
}: {
  fuelType: FuelType;
  fuelPrice: number;
}) {
  const [state, formAction, pending] = useActionState(saveFuelSettings, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-300">Combustível</label>
        <select
          name="fuelType"
          defaultValue={fuelType}
          className="mt-1 w-full max-w-[10rem] rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
        >
          <option value="gasolina">Gasolina</option>
          <option value="etanol">Etanol</option>
          <option value="diesel">Diesel</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300">Preço por litro (R$)</label>
        <input
          name="fuelPrice"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={fuelPrice || ""}
          className="mt-1 w-full max-w-[10rem] rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Você mantém esse valor atualizado manualmente — não é buscado automaticamente.
        </p>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-400">Preço atualizado.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
