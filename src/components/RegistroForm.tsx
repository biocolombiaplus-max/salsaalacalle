"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "success"; ticketCode: string; ticketPngBase64: string | null };

function subscribeNoop() {
  return () => {};
}

function getCanShareSnapshot() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function getCanShareServerSnapshot() {
  return false;
}

export default function RegistroForm() {
  const [form, setForm] = useState({ nombre: "", cedula: "", correo: "", whatsapp: "", barrio: "", aceptaPolitica: false });
  const [result, setResult] = useState<Result>({ state: "idle" });
  const canShare = useSyncExternalStore(subscribeNoop, getCanShareSnapshot, getCanShareServerSnapshot);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.aceptaPolitica) {
      setResult({ state: "error", message: "Debes aceptar la política de tratamiento de datos para continuar." });
      return;
    }
    setResult({ state: "loading" });
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ state: "error", message: data.error || "No fue posible completar tu registro." });
        return;
      }
      setResult({ state: "success", ticketCode: data.ticketCode, ticketPngBase64: data.ticketPngBase64 || null });
    } catch {
      setResult({ state: "error", message: "Error de conexión. Intenta nuevamente." });
    }
  }

  async function handleShare() {
    if (result.state !== "success" || !result.ticketPngBase64) return;
    try {
      const blob = await (await fetch(result.ticketPngBase64)).blob();
      const file = new File([blob], `boleta-${result.ticketCode}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Mi boleta · Salsa a la Calle",
          text: `Ya tengo mi boleta para Salsa a la Calle: ${result.ticketCode}`,
        });
      }
    } catch {
      // El usuario canceló el diálogo de compartir o el navegador lo rechazó; no hacemos nada.
    }
  }

  if (result.state === "success") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6 sm:p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="font-display text-2xl font-bold mb-2">¡Registro confirmado!</h2>
        <p className="text-white/70 text-sm mb-5">
          Tu número de boleta es
        </p>
        <p className="font-display text-3xl font-bold text-gold mb-6 tracking-widest">{result.ticketCode}</p>

        {result.ticketPngBase64 ? (
          <div className="mb-6">
            <div className="relative mx-auto max-w-md">
              <div
                className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-gold/30 via-wine/20 to-green/20 blur-xl opacity-70"
                aria-hidden
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- imagen dinámica en base64 generada en el servidor, no un asset estático optimizable */}
              <img
                src={result.ticketPngBase64}
                alt={`Boleta ${result.ticketCode}`}
                className="relative w-full rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/15"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <a
                href={result.ticketPngBase64}
                download={`boleta-${result.ticketCode}.png`}
                className="inline-flex items-center gap-2 rounded-full bg-gold text-[#1a1408] font-semibold text-sm px-6 py-3 hover:brightness-110 transition"
              >
                ⬇ Descargar boleta
              </a>
              {canShare && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 text-white font-semibold text-sm px-6 py-3 hover:border-gold hover:text-gold transition"
                >
                  ↗ Compartir
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/70 mb-6">
            Tu boleta con el código QR está siendo generada y llegará en breve a tu correo y WhatsApp.
          </p>
        )}

        <p className="text-sm text-white/70 mb-2">
          También te llegará por correo electrónico y WhatsApp para que la tengas siempre a la mano.
        </p>
        <p className="text-xs text-white/40">
          Presenta tu boleta (código QR) en el punto de ingreso el día del evento. Recuerda: no tiene costo y es transferible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 sm:p-8 space-y-5">
      <div>
        <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Nombre completo</label>
        <input
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Como aparecerá en tu boleta"
          className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-3 text-sm outline-none focus:border-gold transition"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Número de cédula</label>
        <input
          required
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={form.cedula}
          onChange={(e) => setForm({ ...form, cedula: e.target.value.replace(/[^\d]/g, "") })}
          placeholder="Sin puntos ni espacios"
          className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-3 text-sm outline-none focus:border-gold transition"
        />
        <p className="text-[11px] text-white/40 mt-1.5">Solo se permite un registro por número de cédula.</p>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Correo electrónico</label>
        <input
          required
          type="email"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
          placeholder="tucorreo@email.com"
          className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-3 text-sm outline-none focus:border-gold transition"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">WhatsApp</label>
        <input
          required
          type="tel"
          value={form.whatsapp}
          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          placeholder="300 000 0000"
          className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-3 text-sm outline-none focus:border-gold transition"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Barrio donde vives</label>
        <input
          required
          value={form.barrio}
          onChange={(e) => setForm({ ...form, barrio: e.target.value })}
          placeholder="Ej. La Riviera"
          className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-3 text-sm outline-none focus:border-gold transition"
        />
      </div>

      <label className="flex items-start gap-3 text-xs text-white/60 pt-1">
        <input
          type="checkbox"
          checked={form.aceptaPolitica}
          onChange={(e) => setForm({ ...form, aceptaPolitica: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-[var(--gold)]"
        />
        <span>
          Autorizo el tratamiento de mis datos personales conforme a la{" "}
          <Link href="/politica-de-datos" target="_blank" className="underline text-gold">
            Política de Tratamiento de Datos Personales
          </Link>{" "}
          de Salsa a la Calle, únicamente para la organización y control de acceso de este evento.
        </span>
      </label>

      {result.state === "error" && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={result.state === "loading"}
        className="w-full rounded-full bg-wine text-white font-semibold py-4 hover:brightness-110 transition disabled:opacity-60"
      >
        {result.state === "loading" ? "Enviando..." : "Confirmar mi registro gratis"}
      </button>
    </form>
  );
}
