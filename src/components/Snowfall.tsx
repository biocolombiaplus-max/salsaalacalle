"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Flake = {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
};

function generateFlakes(count: number): Flake[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 3 + Math.random() * 5,
    duration: 12 + Math.random() * 14,
    delay: Math.random() * -24,
    drift: (Math.random() - 0.5) * 70,
    opacity: 0.3 + Math.random() * 0.4,
  }));
}

export default function Snowfall({ count = 18 }: { count?: number }) {
  // Los copos se generan en el cliente, después de montar: así el HTML del
  // servidor no tiene posiciones aleatorias que choquen con las del cliente
  // al hidratar (evita el parpadeo/discrepancia de hidratación).
  const [flakes, setFlakes] = useState<Flake[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- genera datos decorativos aleatorios una sola vez al montar (no una sincronización repetida); necesario para evitar un choque de hidratación, ya que el servidor no puede usar Math.random()
    setFlakes(generateFlakes(count));
  }, [count]);

  if (flakes.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden will-change-transform"
      style={{ transform: "translateZ(0)" }}
      aria-hidden="true"
    >
      {flakes.map((f) => (
        <span
          key={f.id}
          className="snowflake"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            "--snow-drift": `${f.drift}px`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
