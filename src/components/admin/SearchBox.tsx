"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox({ initialQ, initialEstado }: { initialQ: string; initialEstado: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [estado, setEstado] = useState(initialEstado);

  function apply(nextQ: string, nextEstado: string) {
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    if (nextEstado && nextEstado !== "todos") params.set("estado", nextEstado);
    router.push(`/admin/dashboard${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && apply(q, estado)}
        placeholder="Buscar por nombre, correo, WhatsApp, barrio o código..."
        className="flex-1 rounded-xl bg-black/30 border border-white/15 px-4 py-2.5 text-sm outline-none focus:border-gold transition"
      />
      <select
        value={estado}
        onChange={(e) => {
          setEstado(e.target.value);
          apply(q, e.target.value);
        }}
        className="rounded-xl bg-black/30 border border-white/15 px-4 py-2.5 text-sm outline-none focus:border-gold transition"
      >
        <option value="todos">Todos</option>
        <option value="ingresados">Ya ingresaron</option>
        <option value="pendientes">Pendientes</option>
      </select>
      <button
        onClick={() => apply(q, estado)}
        className="rounded-xl bg-gold text-[#1a1408] font-semibold px-5 py-2.5 text-sm hover:brightness-110 transition"
      >
        Buscar
      </button>
    </div>
  );
}
