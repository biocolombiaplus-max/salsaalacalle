import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [total, hoy, checkins, checkinsHoy] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.registration.count({ where: { checkedInAt: { not: null } } }),
    prisma.registration.count({ where: { checkedInAt: { gte: startOfDay } } }),
  ]);

  return NextResponse.json({ total, hoy, checkins, checkinsHoy });
}
