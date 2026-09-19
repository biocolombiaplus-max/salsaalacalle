"use client";

import { useEffect, useState } from "react";
import AreaTrend from "@/components/admin/charts/AreaTrend";
import BarList from "@/components/admin/charts/BarList";
import StatusDonut from "@/components/admin/charts/StatusDonut";

type DashboardData = {
  total: number;
  hoy: number;
  ingresaron: number;
  pendientes: number;
  serie: { date: string; label: string; registros: number }[];
  topBarrios: { barrio: string; total: number }[];
  entregabilidad: { emailOk: number; emailFallido: number; whatsappOk: number; whatsappFallido: number };
};

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function DeliveryBar({ label, ok, fallido }: { label: string; ok: number; fallido: number }) {
  const total = ok + fallido;
  const pct = total > 0 ? Math.round((ok / total) * 100) : 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-white/70">{label}</span>
        <span className="text-white/50 tabular-nums">
          {ok}/{total || 0} entregados ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-gold rounded-full" style={{ width: `${total > 0 ? pct : 100}%` }} />
      </div>
    </div>
  );
}

export default function DashboardCharts() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch("/api/admin/dashboard-data");
      if (!res.ok) return;
      const json = await res.json();
      if (active) setData(json);
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const kpis = [
    { label: "Registros hoy", value: data?.hoy },
    { label: "Total registros", value: data?.total },
    { label: "Ingresaron", value: data?.ingresaron },
    { label: "Pendientes por ingresar", value: data?.pendientes },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-2xl sm:text-3xl font-display font-bold text-gold tabular-nums">
              {c.value ?? "—"}
            </p>
            <p className="text-xs text-white/50 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Registros por día (últimos 14 días)">
            {data ? <AreaTrend data={data.serie} /> : <p className="text-white/40 text-sm">Cargando...</p>}
          </Card>
        </div>
        <Card title="Estado de ingreso">
          {data ? (
            <StatusDonut ingresaron={data.ingresaron} pendientes={data.pendientes} />
          ) : (
            <p className="text-white/40 text-sm">Cargando...</p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Barrios con más registros">
            {data ? <BarList data={data.topBarrios} /> : <p className="text-white/40 text-sm">Cargando...</p>}
          </Card>
        </div>
        <Card title="Entregabilidad">
          {data ? (
            <div className="space-y-5">
              <DeliveryBar label="Correo" ok={data.entregabilidad.emailOk} fallido={data.entregabilidad.emailFallido} />
              <DeliveryBar label="WhatsApp" ok={data.entregabilidad.whatsappOk} fallido={data.entregabilidad.whatsappFallido} />
            </div>
          ) : (
            <p className="text-white/40 text-sm">Cargando...</p>
          )}
        </Card>
      </div>
    </div>
  );
}
