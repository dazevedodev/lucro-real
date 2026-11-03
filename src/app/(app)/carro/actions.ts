"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CarFormState {
  error?: string;
  success?: boolean;
}

export async function saveCar(_prevState: CarFormState, formData: FormData): Promise<CarFormState> {
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const year = Number(formData.get("year"));
  const consumptionKml = Number(formData.get("consumptionKml"));
  const maintenanceCostPerKm = Number(formData.get("maintenanceCostPerKm"));
  const catalogId = String(formData.get("catalogId") ?? "") || null;
  const carId = String(formData.get("carId") ?? "") || null;

  if (!brand || !model || !year || !consumptionKml || consumptionKml <= 0) {
    return { error: "Preencha marca, modelo, ano e consumo corretamente." };
  }
  if (!maintenanceCostPerKm || maintenanceCostPerKm < 0) {
    return { error: "Custo de manutenção por km inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const payload = {
    user_id: user.id,
    catalog_id: catalogId,
    brand,
    model,
    year,
    consumption_kml: consumptionKml,
    maintenance_cost_per_km: maintenanceCostPerKm,
    is_active: true,
  };

  const { error } = carId
    ? await supabase.from("user_cars").update(payload).eq("id", carId).eq("user_id", user.id)
    : await supabase.from("user_cars").insert(payload);

  if (error) {
    return { error: "Não foi possível salvar o carro. Tente novamente." };
  }

  revalidatePath("/carro");
  revalidatePath("/");
  return { success: true };
}
