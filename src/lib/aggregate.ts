import type { Database } from "./supabase/database.types";

type Ride = Database["public"]["Tables"]["rides"]["Row"];

export interface PeriodStats {
  rideCount: number;
  totalKm: number;
  netProfit: number;
  fuelCost: number;
  maintenanceCost: number;
  profitPerKm: number;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function computePeriodStats(rides: Ride[], sinceISO: string): PeriodStats {
  const inPeriod = rides.filter((r) => r.created_at >= sinceISO);

  const totalKm = inPeriod.reduce((sum, r) => sum + Number(r.km_driven), 0);
  const netProfit = inPeriod.reduce((sum, r) => sum + Number(r.net_profit), 0);
  const fuelCost = inPeriod.reduce((sum, r) => sum + Number(r.fuel_cost), 0);
  const maintenanceCost = inPeriod.reduce((sum, r) => sum + Number(r.maintenance_cost), 0);

  return {
    rideCount: inPeriod.length,
    totalKm: round2(totalKm),
    netProfit: round2(netProfit),
    fuelCost: round2(fuelCost),
    maintenanceCost: round2(maintenanceCost),
    profitPerKm: totalKm > 0 ? round2(netProfit / totalKm) : 0,
  };
}
