import { createClient } from "@/lib/supabase/server";
import FuelSettingsForm from "./FuelSettingsForm";
import BubbleToggle from "./BubbleToggle";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("fuel_type, fuel_price")
    .eq("id", user!.id)
    .single();

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Configurações</h1>
      <p className="mt-1 text-sm text-neutral-400">Preço do combustível usado nos cálculos.</p>
      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <FuelSettingsForm
          fuelType={profile?.fuel_type ?? "gasolina"}
          fuelPrice={profile?.fuel_price ?? 0}
        />
      </div>

      <h2 className="mt-8 text-xl font-bold text-white">Bolha flutuante</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Registre corridas sem sair do app da Uber/99.
      </p>
      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <BubbleToggle />
      </div>
    </div>
  );
}
