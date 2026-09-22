"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/checkin", label: "Check-in", icon: "🎫" },
  { href: "/admin/settings", label: "Personalizar", icon: "🎨" },
  { href: "/admin/historias", label: "Historias", icon: "📱" },
];

export default function AdminNav({ email, nombre }: { email: string; nombre: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-black/30 p-5 sm:p-6 flex md:flex-col justify-between">
      <div className="flex md:flex-col items-center md:items-start gap-6 md:gap-10 w-full">
        <div>
          <p className="font-display text-lg font-bold">Salsa a la Calle</p>
          <p className="text-[11px] text-white/40">Panel administrativo</p>
        </div>
        <nav className="flex md:flex-col gap-2 flex-1 md:w-full">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                  active ? "bg-gold text-[#1a1408] font-semibold" : "text-white/70 hover:bg-white/5"
                }`}
              >
                <span>{l.icon}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="hidden md:block mt-8 pt-6 border-t border-white/10">
        <p className="text-xs text-white/70 font-medium truncate">{nombre}</p>
        <p className="text-[11px] text-white/40 truncate mb-3">{email}</p>
        <button onClick={logout} className="text-xs text-red-400 hover:text-red-300">
          Cerrar sesión
        </button>
      </div>
      <button onClick={logout} className="md:hidden text-xs text-red-400">
        Salir
      </button>
    </aside>
  );
}
