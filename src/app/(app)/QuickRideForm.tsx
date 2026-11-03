"use client";

import { useActionState, useRef, useEffect } from "react";
import { addRide, type AddRideState } from "./actions";

const initialState: AddRideState = {};

export default function QuickRideForm() {
  const [state, formAction, pending] = useActionState(addRide, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-neutral-400">Valor recebido (R$)</label>
        <input
          name="valueReceived"
          type="number"
          step="0.01"
          min="0"
          required
          className="mt-1 w-32 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-400">Km rodado</label>
        <input
          name="kmDriven"
          type="number"
          step="0.1"
          min="0"
          required
          className="mt-1 w-28 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Registrar corrida"}
      </button>
      {state.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-emerald-400">Corrida registrada.</p>}
    </form>
  );
}
