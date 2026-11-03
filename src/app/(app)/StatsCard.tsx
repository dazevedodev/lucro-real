import type { PeriodStats } from "@/lib/aggregate";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function StatsCard({ title, stats }: { title: string; stats: PeriodStats }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-sm font-medium text-neutral-400">{title}</h2>
      <p className="mt-1 text-2xl font-bold text-emerald-400">{formatBRL(stats.netProfit)}</p>
      <dl className="mt-4 space-y-1 text-sm text-neutral-400">
        <div className="flex justify-between">
          <dt>Corridas</dt>
          <dd className="text-neutral-200">{stats.rideCount}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Km rodados</dt>
          <dd className="text-neutral-200">{stats.totalKm.toLocaleString("pt-BR")} km</dd>
        </div>
        <div className="flex justify-between">
          <dt>Combustível + manutenção</dt>
          <dd className="text-neutral-200">{formatBRL(stats.fuelCost + stats.maintenanceCost)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Lucro médio/km</dt>
          <dd className="text-neutral-200">{formatBRL(stats.profitPerKm)}</dd>
        </div>
      </dl>
    </div>
  );
}
