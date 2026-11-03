import { createClient } from "@/lib/supabase/server";
import CarForm from "./CarForm";

export default async function CarroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: catalog }, { data: existingCar }] = await Promise.all([
    supabase.from("car_models_catalog").select("*").order("brand"),
    supabase
      .from("user_cars")
      .select("*")
      .eq("user_id", user!.id)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Meu carro</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Selecione marca, modelo e ano — o consumo médio é sugerido automaticamente.
      </p>
      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <CarForm catalog={catalog ?? []} existingCar={existingCar ?? null} />
      </div>
    </div>
  );
}
