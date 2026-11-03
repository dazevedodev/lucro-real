export interface RideCalcInput {
  valueReceived: number;
  kmDriven: number;
  fuelPrice: number;
  consumptionKml: number;
  maintenanceCostPerKm: number;
}

export interface RideCalcResult {
  fuelCost: number;
  maintenanceCost: number;
  netProfit: number;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateRide(input: RideCalcInput): RideCalcResult {
  // Arredonda combustível e manutenção primeiro, e calcula o lucro a partir
  // desses valores já arredondados — assim os três números sempre somam
  // exatamente o valor recebido (evita "sobrar"/"faltar" 1 centavo no total).
  const fuelCost = round2((input.kmDriven / input.consumptionKml) * input.fuelPrice);
  const maintenanceCost = round2(input.kmDriven * input.maintenanceCostPerKm);
  const netProfit = round2(input.valueReceived - fuelCost - maintenanceCost);

  return { fuelCost, maintenanceCost, netProfit };
}
