const SIZE = 160;
const STROKE = 20;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export default function StatusDonut({ ingresaron, pendientes }: { ingresaron: number; pendientes: number }) {
  const total = ingresaron + pendientes;
  const pct = total > 0 ? ingresaron / total : 0;
  const dash = C * pct;

  return (
    <div className="flex items-center gap-6">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="white"
          strokeOpacity={0.08}
          strokeWidth={STROKE}
        />
        {total > 0 && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--green)"
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${C - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        )}
        <text x="50%" y="47%" textAnchor="middle" fontSize={26} fontWeight={700} fill="white">
          {total > 0 ? Math.round(pct * 100) : 0}%
        </text>
        <text x="50%" y="63%" textAnchor="middle" fontSize={10} fill="white" fillOpacity={0.5}>
          ingresaron
        </text>
      </svg>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green" />
          <span className="text-white/80">Ingresaron</span>
          <span className="text-white/50 tabular-nums">({ingresaron})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="text-white/80">Pendientes</span>
          <span className="text-white/50 tabular-nums">({pendientes})</span>
        </div>
      </div>
    </div>
  );
}
