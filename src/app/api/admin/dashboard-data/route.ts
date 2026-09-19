import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rows = await prisma.registration.findMany({
    select: {
      createdAt: true,
      barrio: true,
      checkedInAt: true,
      emailSentAt: true,
      emailError: true,
      whatsappSentAt: true,
      whatsappError: true,
    },
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Serie de los últimos 14 días
  const DAYS = 14;
  const dayBuckets: { date: string; label: string; registros: number }[] = [];
  const bucketIndex = new Map<string, number>();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    bucketIndex.set(key, dayBuckets.length);
    dayBuckets.push({
      date: key,
      label: d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
      registros: 0,
    });
  }
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    const idx = bucketIndex.get(key);
    if (idx !== undefined) dayBuckets[idx].registros++;
  }

  // Top barrios
  const barrioCounts = new Map<string, number>();
  for (const r of rows) {
    const key = r.barrio.trim() || "Sin especificar";
    barrioCounts.set(key, (barrioCounts.get(key) || 0) + 1);
  }
  const topBarrios = Array.from(barrioCounts.entries())
    .map(([barrio, total]) => ({ barrio, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Estado de ingreso
  const ingresaron = rows.filter((r) => r.checkedInAt).length;
  const pendientes = rows.length - ingresaron;

  // Entregabilidad de comunicaciones
  const emailOk = rows.filter((r) => r.emailSentAt && !r.emailError).length;
  const emailFallido = rows.filter((r) => r.emailError).length;
  const whatsappOk = rows.filter((r) => r.whatsappSentAt && !r.whatsappError).length;
  const whatsappFallido = rows.filter((r) => r.whatsappError).length;

  return NextResponse.json({
    total: rows.length,
    hoy: dayBuckets[dayBuckets.length - 1]?.registros ?? 0,
    ingresaron,
    pendientes,
    serie: dayBuckets,
    topBarrios,
    entregabilidad: { emailOk, emailFallido, whatsappOk, whatsappFallido },
  });
}
