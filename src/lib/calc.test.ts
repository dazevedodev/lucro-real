import { describe, expect, it } from "vitest";
import { calculateRide } from "./calc";

describe("calculateRide", () => {
  it("calcula combustível, manutenção e lucro líquido corretamente", () => {
    const result = calculateRide({
      valueReceived: 25,
      kmDriven: 8.5,
      fuelPrice: 5.89,
      consumptionKml: 13,
      maintenanceCostPerKm: 0.15,
    });

    expect(result.fuelCost).toBe(3.85);
    expect(result.maintenanceCost).toBe(1.27);
    expect(result.netProfit).toBe(19.88);
  });

  it("garante que os três valores sempre somam exatamente o valor recebido", () => {
    // Regressão: antes da correção, netProfit era calculado a partir dos
    // valores brutos (não arredondados), enquanto fuelCost/maintenanceCost
    // eram armazenados já arredondados — os três números não fechavam com
    // o valor recebido (diferença de 1 centavo). Ver memória de projeto.
    const cases = [
      { valueReceived: 25, kmDriven: 8.5, fuelPrice: 5.89, consumptionKml: 13, maintenanceCostPerKm: 0.15 },
      { valueReceived: 12.5, kmDriven: 3.2, fuelPrice: 6.13, consumptionKml: 11.5, maintenanceCostPerKm: 0.18 },
      { valueReceived: 47.9, kmDriven: 15.75, fuelPrice: 5.5, consumptionKml: 14.2, maintenanceCostPerKm: 0.12 },
    ];

    for (const input of cases) {
      const result = calculateRide(input);
      const sum = Math.round((result.fuelCost + result.maintenanceCost + result.netProfit) * 100) / 100;
      expect(sum).toBe(input.valueReceived);
    }
  });

  it("lucro pode ser negativo quando o custo supera o valor recebido", () => {
    const result = calculateRide({
      valueReceived: 5,
      kmDriven: 20,
      fuelPrice: 6,
      consumptionKml: 10,
      maintenanceCostPerKm: 0.2,
    });

    expect(result.netProfit).toBeLessThan(0);
  });
});
