"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No fue posible iniciar sesión");
        setLoading(false);
        return;
      }
      router.push(params.get("next") || "/admin/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-5">
        <div className="text-center mb-4">
          <p className="uppercase tracking-[0.3em] text-gold text-xs mb-2">Panel administrativo</p>
          <h1 className="font-display text-2xl font-bold">Salsa a la Calle</h1>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Correo</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-3 text-sm outline-none focus:border-gold transition"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Contraseña</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-3 text-sm outline-none focus:border-gold transition"
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gold text-[#1a1408] font-semibold py-3.5 hover:brightness-110 transition disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
