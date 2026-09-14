"use client";

import { useEffect, useState } from "react";

type Stats = { total: number; hoy: number; checkins: number; checkinsHoy: number };

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) return;
      const data = await res.json();
      if (active) setStats(data);
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const cards = [
    { label: "Registros hoy", value: stats?.hoy },
    { label: "Total registros", value: stats?.total },
    { label: "Check-ins hoy", value: stats?.checkinsHoy },
    { label: "Total ingresos", value: stats?.checkins },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-2xl sm:text-3xl font-display font-bold text-gold tabular-nums">
            {c.value ?? "—"}
          </p>
          <p className="text-xs text-white/50 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
