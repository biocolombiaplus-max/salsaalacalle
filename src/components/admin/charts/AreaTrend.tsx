"use client";

import { useMemo, useState } from "react";

type Point = { label: string; registros: number };

const WIDTH = 640;
const HEIGHT = 220;
const PAD_L = 32;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 28;

export default function AreaTrend({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const { points, path, areaPath, maxY, yTicks } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.registros));
    const niceMax = Math.ceil(max / 5) * 5 || 5;
    const innerW = WIDTH - PAD_L - PAD_R;
    const innerH = HEIGHT - PAD_T - PAD_B;
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

    const pts = data.map((d, i) => {
      const x = PAD_L + stepX * i;
      const y = PAD_T + innerH - (d.registros / niceMax) * innerH;
      return { x, y, ...d };
    });

    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const area =
      pts.length > 0
        ? `${linePath} L ${pts[pts.length - 1].x} ${PAD_T + innerH} L ${pts[0].x} ${PAD_T + innerH} Z`
        : "";

    const ticks = [0, niceMax / 2, niceMax];

    return { points: pts, path: linePath, areaPath: area, maxY: niceMax, yTicks: ticks };
  }, [data]);

  const active = hover !== null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t) => {
          const innerH = HEIGHT - PAD_T - PAD_B;
          const y = PAD_T + innerH - (t / maxY) * innerH;
          return (
            <g key={t}>
              <line x1={PAD_L} x2={WIDTH - PAD_R} y1={y} y2={y} stroke="white" strokeOpacity={0.06} strokeWidth={1} />
              <text x={PAD_L - 8} y={y + 3} textAnchor="end" fontSize={10} fill="white" fillOpacity={0.4}>
                {t}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#areaFill)" />}
        {path && <path d={path} fill="none" stroke="var(--gold)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}

        {points.map((p, i) => (
          <g key={p.label}>
            <rect
              x={p.x - (points.length > 1 ? (points[1].x - points[0].x) / 2 : 20)}
              y={PAD_T}
              width={points.length > 1 ? points[1].x - points[0].x : 40}
              height={HEIGHT - PAD_T - PAD_B}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
            {(i === hover || i === points.length - 1) && (
              <circle cx={p.x} cy={p.y} r={i === hover ? 4 : 3} fill="var(--gold)" stroke="#0a0708" strokeWidth={1.5} />
            )}
            {i % Math.ceil(points.length / 7) === 0 && (
              <text x={p.x} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="white" fillOpacity={0.4}>
                {p.label}
              </text>
            )}
          </g>
        ))}

        {active && (
          <line x1={active.x} x2={active.x} y1={PAD_T} y2={HEIGHT - PAD_B} stroke="white" strokeOpacity={0.15} strokeWidth={1} />
        )}
      </svg>

      {active && (
        <div
          className="absolute top-2 pointer-events-none rounded-lg bg-black/90 border border-white/10 px-3 py-1.5 text-xs whitespace-nowrap -translate-x-1/2"
          style={{ left: `${(active.x / WIDTH) * 100}%` }}
        >
          <p className="text-white/50">{active.label}</p>
          <p className="text-gold font-semibold">{active.registros} registros</p>
        </div>
      )}
    </div>
  );
}
