"use client";

import { useEffect, useState } from "react";

function calc(target: number) {
  const diff = Math.max(0, target - Date.now());
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);
  const segundos = Math.floor((diff / 1000) % 60);
  return { dias, horas, minutos, segundos, done: diff === 0 };
}

export default function Countdown({ fechaISO }: { fechaISO: string }) {
  const target = new Date(fechaISO).getTime();
  const [t, setT] = useState<ReturnType<typeof calc> | null>(null);

  useEffect(() => {
    setT(calc(target));
    const id = setInterval(() => setT(calc(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!t || Number.isNaN(target) || t.done) return null;

  const items = [
    { label: "Días", value: t.dias },
    { label: "Horas", value: t.horas },
    { label: "Min", value: t.minutos },
    { label: "Seg", value: t.segundos },
  ];

  return (
    <div className="flex gap-3 sm:gap-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex flex-col items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
        >
          <span className="font-display text-xl sm:text-2xl font-bold text-gold tabular-nums">
            {String(it.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/60 mt-1">
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}
