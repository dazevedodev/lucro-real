import { describe, expect, it } from "vitest";
import { computePeriodStats } from "./aggregate";
import type { Database } from "./supabase/database.types";

type Ride = Database["public"]["Tables"]["rides"]["Row"];

function makeRide(overrides: Partial<Ride>): Ride {
  return {
    id: "id",
    user_id: "user",
    car_id: "car",
    value_received: 25,
    km_driven: 10,
    fuel_price_snapshot: 5.89,
    consumption_kml_snapshot: 13,
    maintenance_cost_per_km_snapshot: 0.15,
    fuel_cost: 5,
    maintenance_cost: 1.5,
    net_profit: 18.5,
    created_at: "2026-07-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("computePeriodStats", () => {
  it("soma corridas dentro do período e calcula lucro médio por km", () => {
    const rides = [
      makeRide({ created_at: "2026-07-27T10:00:00.000Z", km_driven: 10, net_profit: 20, fuel_cost: 3, maintenance_cost: 2 }),
      makeRide({ created_at: "2026-07-27T11:00:00.000Z", km_driven: 5, net_profit: 10, fuel_cost: 1.5, maintenance_cost: 1 }),
    ];

    const stats = computePeriodStats(rides, "2026-07-27T00:00:00.000Z");

    expect(stats.rideCount).toBe(2);
    expect(stats.totalKm).toBe(15);
    expect(stats.netProfit).toBe(30);
    expect(stats.fuelCost).toBe(4.5);
    expect(stats.maintenanceCost).toBe(3);
    expect(stats.profitPerKm).toBe(2);
  });

  it("ignora corridas fora do período (antes do sinceISO)", () => {
    const rides = [
      makeRide({ created_at: "2026-07-26T23:00:00.000Z", net_profit: 100 }), // fora
      makeRide({ created_at: "2026-07-27T01:00:00.000Z", net_profit: 20 }), // dentro
    ];

    const stats = computePeriodStats(rides, "2026-07-27T00:00:00.000Z");

    expect(stats.rideCount).toBe(1);
    expect(stats.netProfit).toBe(20);
  });

  it("não gera NaN/divisão por zero quando não há corridas no período", () => {
    const stats = computePeriodStats([], "2026-07-27T00:00:00.000Z");

    expect(stats.rideCount).toBe(0);
    expect(stats.totalKm).toBe(0);
    expect(stats.netProfit).toBe(0);
    expect(stats.profitPerKm).toBe(0);
  });
});
