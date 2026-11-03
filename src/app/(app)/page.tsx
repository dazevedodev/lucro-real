import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPeriodStarts } from "@/lib/period";
import { computePeriodStats } from "@/lib/aggregate";
import QuickRideForm from "./QuickRideForm";
import StatsCard from "./StatsCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { dayStart, weekStart, monthStart } = getPeriodStarts();

  const [{ data: car }, { data: rides }] = await Promise.all([
    supabase
      .from("user_cars")
      .select("id")
      .eq("user_id", user!.id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("rides")
      .select("*")
      .eq("user_id", user!.id)
      .gte("created_at", monthStart)
      .order("created_at", { ascending: false }),
  ]);

  const allRides = rides ?? [];
  const dayStats = computePeriodStats(allRides, dayStart);
  const weekStats = computePeriodStats(allRides, weekStart);
  const monthStats = computePeriodStats(allRides, monthStart);

  if (!car) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="text-xl font-bold text-white">Bem-vindo</h1>
        <p className="mt-2 text-neutral-400">
          Antes de registrar corridas, cadastre seu carro para calcularmos o consumo médio.
        </p>
        <Link
          href="/carro"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
        >
          Cadastrar carro
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <h1 className="text-sm font-medium text-neutral-400">Registrar corrida</h1>
        <div className="mt-3">
          <QuickRideForm />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Hoje" stats={dayStats} />
        <StatsCard title="Esta semana" stats={weekStats} />
        <StatsCard title="Este mês" stats={monthStats} />
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-sm font-medium text-neutral-400">Últimas corridas</h2>
        <div className="mt-3 divide-y divide-neutral-800">
          {allRides.slice(0, 10).map((ride) => (
            <div key={ride.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-neutral-400">
                {new Date(ride.created_at).toLocaleString("pt-BR")}
              </span>
              <span className="text-neutral-300">{Number(ride.km_driven).toFixed(1)} km</span>
              <span
                className={
                  Number(ride.net_profit) >= 0 ? "text-emerald-400" : "text-red-400"
                }
              >
                {Number(ride.net_profit).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          ))}
          {allRides.length === 0 && (
            <p className="py-2 text-sm text-neutral-500">Nenhuma corrida registrada ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
