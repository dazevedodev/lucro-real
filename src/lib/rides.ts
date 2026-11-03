import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateRide } from "./calc";
import type { Database } from "./supabase/database.types";

export interface CreateRideInput {
  valueReceived: number;
  kmDriven: number;
}

export interface CreateRideResult {
  error?: string;
  ride?: Database["public"]["Tables"]["rides"]["Row"];
}

// Usada tanto pelo formulário rápido web quanto (futuramente) pela bolha
// nativa Android via /api/rides — a regra de cálculo mora só aqui.
export async function createRideForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateRideInput
): Promise<CreateRideResult> {
  if (!input.valueReceived || input.valueReceived < 0) {
    return { error: "Valor recebido inválido." };
  }
  if (!input.kmDriven || input.kmDriven <= 0) {
    return { error: "Km rodado inválido." };
  }

  const [{ data: car }, { data: profile }] = await Promise.all([
    supabase
      .from("user_cars")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase.from("profiles").select("fuel_price").eq("id", userId).single(),
  ]);

  if (!car) {
    return { error: "Cadastre seu carro antes de registrar corridas." };
  }
  if (!profile?.fuel_price || profile.fuel_price <= 0) {
    return { error: "Defina o preço do combustível em Configurações antes de registrar corridas." };
  }

  const result = calculateRide({
    valueReceived: input.valueReceived,
    kmDriven: input.kmDriven,
    fuelPrice: profile.fuel_price,
    consumptionKml: car.consumption_kml,
    maintenanceCostPerKm: car.maintenance_cost_per_km,
  });

  const { data: ride, error } = await supabase
    .from("rides")
    .insert({
      user_id: userId,
      car_id: car.id,
      value_received: input.valueReceived,
      km_driven: input.kmDriven,
      fuel_price_snapshot: profile.fuel_price,
      consumption_kml_snapshot: car.consumption_kml,
      maintenance_cost_per_km_snapshot: car.maintenance_cost_per_km,
      fuel_cost: result.fuelCost,
      maintenance_cost: result.maintenanceCost,
      net_profit: result.netProfit,
    })
    .select()
    .single();

  if (error || !ride) {
    return { error: "Não foi possível registrar a corrida. Tente novamente." };
  }

  return { ride };
}
