import { prisma } from "@/lib/db";
import DashboardCharts from "@/components/admin/DashboardCharts";
import SearchBox from "@/components/admin/SearchBox";
import type { Prisma } from "@prisma/client";

export const revalidate = 0;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const estado = params.estado || "todos";

  const where: Prisma.RegistrationWhereInput = {};
  if (q) {
    where.OR = [
      { nombre: { contains: q } },
      { cedula: { contains: q } },
      { correo: { contains: q } },
      { whatsapp: { contains: q } },
      { barrio: { contains: q } },
      { ticketCode: { contains: q } },
    ];
  }
  if (estado === "ingresados") where.checkedInAt = { not: null };
  if (estado === "pendientes") where.checkedInAt = null;

  const registros = await prisma.registration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Dashboard de registros</h1>
          <p className="text-white/50 text-sm mt-1">Consulta y verifica el avance del registro en tiempo real.</p>
        </div>
      </div>

      <DashboardCharts />

      <div className="mt-10 mb-4">
        <h2 className="font-display text-xl font-bold mb-4">Registros</h2>
        <SearchBox initialQ={q} initialEstado={estado} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-white/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Boleta</th>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Cédula</th>
              <th className="text-left px-4 py-3">Correo</th>
              <th className="text-left px-4 py-3">WhatsApp</th>
              <th className="text-left px-4 py-3">Barrio</th>
              <th className="text-left px-4 py-3">Registrado</th>
              <th className="text-left px-4 py-3">Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-gold">{r.ticketCode}</td>
                <td className="px-4 py-3">{r.nombre}</td>
                <td className="px-4 py-3 text-white/70 font-mono">{r.cedula}</td>
                <td className="px-4 py-3 text-white/70">{r.correo}</td>
                <td className="px-4 py-3 text-white/70">{r.whatsapp}</td>
                <td className="px-4 py-3 text-white/70">{r.barrio}</td>
                <td className="px-4 py-3 text-white/50 text-xs">
                  {r.createdAt.toLocaleString("es-CO")}
                </td>
                <td className="px-4 py-3">
                  {r.checkedInAt ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Ingresó
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/20" /> Pendiente
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {registros.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-white/40">
                  No hay registros que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/30 mt-3">Mostrando los últimos {registros.length} registros.</p>
    </div>
  );
}
