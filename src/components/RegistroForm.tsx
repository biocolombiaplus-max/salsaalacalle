"use client";

import { useState } from "react";
import Link from "next/link";

type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "success"; ticketCode: string; emailOk: boolean; whatsappOk: boolean };

export default function RegistroForm() {
  const [form, setForm] = useState({ nombre: "", correo: "", whatsapp: "", barrio: "", aceptaPolitica: false });
  const [result, setResult] = useState<Result>({ state: "idle" });

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
      setResult({ state: "success", ticketCode: data.ticketCode, emailOk: data.emailOk, whatsappOk: data.whatsappOk });
    } catch {
      setResult({ state: "error", message: "Error de conexión. Intenta nuevamente." });
    }
  }

  if (result.state === "success") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="font-display text-2xl font-bold mb-2">¡Registro confirmado!</h2>
        <p className="text-white/70 text-sm mb-5">
          Tu número de boleta es
        </p>
        <p className="font-display text-3xl font-bold text-gold mb-6 tracking-widest">{result.ticketCode}</p>
        <div className="text-sm text-white/70 space-y-1 mb-6">
          <p>{result.emailOk ? "✓ Boleta enviada a tu correo electrónico." : "⚠ No pudimos enviar el correo, revisa el buzón de spam más tarde o contáctanos."}</p>
          <p>{result.whatsappOk ? "✓ Boleta enviada a tu WhatsApp." : "⚠ No pudimos enviar el WhatsApp, guarda tu número de boleta."}</p>
        </div>
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
