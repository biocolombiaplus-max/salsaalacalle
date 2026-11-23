import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  cancion: z.string().trim().min(2, "Escribe el nombre de la canción").max(100),
  artista: z.string().trim().max(80).optional().or(z.literal("")),
  nombre: z.string().trim().max(60).optional().or(z.literal("")),
  // Campo trampa invisible para bots: si viene lleno, se descarta en silencio.
  web: z.string().max(0).optional().or(z.literal("")),
});

export async function GET() {
  const canciones = await prisma.songRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ canciones });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || "Datos inválidos" }, { status: 400 });
  }

  if (parsed.data.web) {
    // Honeypot activado: responde como si todo hubiera salido bien, sin guardar nada.
    return NextResponse.json({ ok: true });
  }

  const cancion = await prisma.songRequest.create({
    data: {
      cancion: parsed.data.cancion,
      artista: parsed.data.artista || null,
      nombre: parsed.data.nombre || null,
    },
  });

  return NextResponse.json({ ok: true, cancion });
}
