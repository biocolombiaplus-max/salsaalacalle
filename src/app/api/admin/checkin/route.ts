import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { verifyQrPayload } from "@/lib/ticket";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const raw = typeof body?.code === "string" ? body.code.trim() : "";
  const force = Boolean(body?.force);
  if (!raw) return NextResponse.json({ error: "Código vacío" }, { status: 400 });

  let ticketCode: string;
  if (raw.includes("|")) {
    const result = verifyQrPayload(raw);
    if (!result.valid || !result.ticketCode) {
      return NextResponse.json({ status: "invalido", reason: result.reason || "Código QR no válido" });
    }
    ticketCode = result.ticketCode;
  } else {
    ticketCode = raw.toUpperCase();
  }

  const registration = await prisma.registration.findUnique({ where: { ticketCode } });
  if (!registration) {
    return NextResponse.json({ status: "invalido", reason: "Boleta no encontrada" });
  }

  if (registration.status === "anulado") {
    return NextResponse.json({
      status: "anulado",
      reason: "Esta boleta fue anulada",
      registration: { nombre: registration.nombre, cedula: registration.cedula, ticketCode: registration.ticketCode },
    });
  }

  if (registration.checkedInAt && !force) {
    return NextResponse.json({
      status: "repetido",
      reason: `Ingreso ya confirmado el ${registration.checkedInAt.toLocaleString("es-CO")}`,
      registration: {
        nombre: registration.nombre,
        cedula: registration.cedula,
        ticketCode: registration.ticketCode,
        checkedInAt: registration.checkedInAt,
      },
    });
  }

  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: { checkedInAt: new Date(), checkedInBy: session.email },
  });

  await prisma.auditLog.create({
    data: {
      action: "checkin",
      actor: session.email,
      detail: `Boleta ${ticketCode} (${registration.nombre})${force ? " [reingreso forzado]" : ""}`,
    },
  });

  return NextResponse.json({
    status: "ok",
    registration: {
      nombre: updated.nombre,
      cedula: updated.cedula,
      ticketCode: updated.ticketCode,
      barrio: updated.barrio,
      checkedInAt: updated.checkedInAt,
    },
  });
}
