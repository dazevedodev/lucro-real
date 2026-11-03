"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FuelType } from "@/lib/supabase/database.types";

export interface FuelSettingsState {
  error?: string;
  success?: boolean;
}

const VALID_FUEL_TYPES: FuelType[] = ["gasolina", "etanol", "diesel"];

export async function saveFuelSettings(
  _prevState: FuelSettingsState,
  formData: FormData
): Promise<FuelSettingsState> {
  const fuelType = String(formData.get("fuelType") ?? "");
  const fuelPrice = Number(formData.get("fuelPrice"));

  if (!VALID_FUEL_TYPES.includes(fuelType as FuelType)) {
    return { error: "Tipo de combustível inválido." };
  }
  if (!fuelPrice || fuelPrice <= 0) {
    return { error: "Informe um preço de combustível válido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({ fuel_type: fuelType as FuelType, fuel_price: fuelPrice })
    .eq("id", user.id);

  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/configuracoes");
  revalidatePath("/");
  return { success: true };
}
