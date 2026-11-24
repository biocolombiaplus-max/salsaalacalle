import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({ id: z.string().min(1) });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const clasico = await prisma.cancionClasica
    .update({
      where: { id: parsed.data.id },
      data: { votos: { increment: 1 } },
    })
    .catch(() => null);

  if (!clasico) {
    return NextResponse.json({ error: "No se encontró esa canción" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, clasico });
}
