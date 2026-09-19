type Item = { barrio: string; total: number };

export default function BarList({ data }: { data: Item[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));

  if (data.length === 0) {
    return <p className="text-white/40 text-sm">Aún no hay datos suficientes.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.barrio} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs text-white/70 truncate" title={d.barrio}>
            {d.barrio}
          </span>
          <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${Math.max(4, (d.total / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-xs text-white/60 tabular-nums">{d.total}</span>
        </div>
      ))}
    </div>
  );
}
