"use client";

import { useEffect, useState, type FormEvent } from "react";

type Clasico = {
  id: string;
  cancion: string;
  artista: string;
  votos: number;
};

const VOTO_STORAGE_KEY = "sac_voto_clasico";

export default function CancionesSection({
  eventoEdicion,
}: {
  eventoEdicion: string;
}) {
  const [cancion, setCancion] = useState("");
  const [artista, setArtista] = useState("");
  const [nombre, setNombre] = useState("");
  const [web, setWeb] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const [clasicos, setClasicos] = useState<Clasico[]>([]);
  const [votedId, setVotedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clasicos")
      .then((r) => r.json())
      .then((data) => setClasicos(data.clasicos || []))
      .catch(() => {});
    try {
      const saved = localStorage.getItem(VOTO_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza una sola vez al montar con localStorage (API externa solo disponible en el cliente), no una sincronización repetida
      if (saved) setVotedId(saved);
    } catch {
      // localStorage no disponible (navegación privada, etc.); se puede votar sin restricción local
    }
  }, []);

  async function handleVote(id: string) {
    if (votedId) return;
    setVotedId(id);
    try {
      localStorage.setItem(VOTO_STORAGE_KEY, id);
    } catch {
      // ignorar si no hay localStorage disponible
    }
    setClasicos((prev) => prev.map((c) => (c.id === id ? { ...c, votos: c.votos + 1 } : c)));
    try {
      await fetch("/api/clasicos/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // el voto ya se reflejó en pantalla; si falla la red no revertimos para no confundir
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!cancion.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/canciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancion, artista, nombre, web }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar tu canción");
      setStatus("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo enviar tu canción");
      setStatus("error");
    }
  }

  async function handleShare() {
    const text = `Yo quiero bailar "${cancion}"${artista ? ` de ${artista}` : ""} en Salsa a la Calle · ${eventoEdicion} 🕺💃 ¿Y tú qué canción pides?`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // el usuario canceló el share nativo; cae al respaldo de copiar texto
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 3000);
    } catch {
      // portapapeles no disponible; no hay más respaldo posible
    }
  }

  function resetForm() {
    setCancion("");
    setArtista("");
    setNombre("");
    setStatus("idle");
  }

  return (
    <section id="canciones" className="relative py-14 sm:py-20 px-5 sm:px-8 border-b border-white/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-wine/[0.06] via-transparent to-transparent" aria-hidden />
      <div className="relative max-w-3xl mx-auto text-center mb-10">
        <p className="uppercase tracking-[0.3em] text-green text-xs sm:text-sm mb-4">Pide tu canción</p>
        <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4">¿Qué quieres bailar esa noche?</h2>
        <p className="text-white/70 text-base sm:text-lg leading-relaxed">
          Cuéntanos qué canción no puede faltar en {eventoEdicion}. Las más pedidas suenan en la pista.
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          {status === "sent" ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-3">🎶</p>
              <p className="font-display text-xl font-bold mb-2">¡Listo, ya quedó tu pedido!</p>
              <p className="text-white/60 text-sm mb-6">
                Cuéntale a tus amigos qué canción pediste e invítalos al evento.
              </p>
              <button
                onClick={handleShare}
                className="btn-shine inline-flex items-center gap-2 rounded-full bg-wine px-6 py-3 font-semibold text-white hover:brightness-110 transition text-sm mb-3"
              >
                Compartir en Instagram <span aria-hidden>📲</span>
              </button>
              {shareState === "copied" && (
                <p className="text-xs text-gold mb-3">
                  Copiamos el mensaje · pégalo en tu historia o chat de Instagram.
                </p>
              )}
              <button onClick={resetForm} className="block mx-auto text-xs text-white/50 hover:text-white underline underline-offset-4">
                Pedir otra canción
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">Canción</label>
                <input
                  value={cancion}
                  onChange={(e) => setCancion(e.target.value)}
                  maxLength={100}
                  required
                  placeholder="Ej: La Rebelión"
                  className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-2.5 text-sm outline-none focus:border-gold transition"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">Artista (opcional)</label>
                <input
                  value={artista}
                  onChange={(e) => setArtista(e.target.value)}
                  maxLength={80}
                  placeholder="Ej: Joe Arroyo"
                  className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-2.5 text-sm outline-none focus:border-gold transition"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">
                  Tu nombre o @ de Instagram (opcional)
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={60}
                  placeholder="Ej: @juanito"
                  className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-2.5 text-sm outline-none focus:border-gold transition"
                />
              </div>
              {/* Honeypot: invisible para personas, visible para bots de formularios. */}
              <input
                type="text"
                value={web}
                onChange={(e) => setWeb(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="absolute opacity-0 pointer-events-none h-0 w-0"
                aria-hidden="true"
              />
              {status === "error" && <p className="text-xs text-red-400">{errorMsg}</p>}
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-shine w-full inline-flex items-center justify-center gap-2 rounded-full bg-wine px-6 py-3 font-semibold text-white hover:brightness-110 transition text-sm disabled:opacity-60"
              >
                {status === "sending" ? "Enviando..." : "Enviar mi canción"} <span aria-hidden>🎵</span>
              </button>
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-4">Vota tu clásico favorito</p>
          <div className="space-y-3">
            {clasicos.map((c) => {
              const maxVotos = Math.max(1, ...clasicos.map((x) => x.votos));
              const pct = Math.round((c.votos / maxVotos) * 100);
              const isVoted = votedId === c.id;
              return (
                <div key={c.id} className="relative rounded-xl border border-white/10 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-green/15 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                  <div className="relative flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{c.cancion}</p>
                      <p className="text-white/50 text-xs truncate">{c.artista}</p>
                    </div>
                    <span className="text-[11px] text-white/40 shrink-0">
                      {c.votos} {c.votos === 1 ? "voto" : "votos"}
                    </span>
                    <button
                      onClick={() => handleVote(c.id)}
                      disabled={!!votedId}
                      aria-label={`Votar por ${c.cancion}`}
                      className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition ${
                        isVoted
                          ? "bg-green text-[#122003]"
                          : "bg-white/10 hover:bg-green/30 text-white disabled:opacity-30 disabled:hover:bg-white/10"
                      }`}
                    >
                      {isVoted ? "✓" : "🤍"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {votedId ? (
            <p className="text-xs text-green mt-4 text-center">¡Gracias por votar! 🎉</p>
          ) : (
            <p className="text-xs text-white/40 mt-4 text-center">Un voto por persona.</p>
          )}
        </div>
      </div>
    </section>
  );
}
