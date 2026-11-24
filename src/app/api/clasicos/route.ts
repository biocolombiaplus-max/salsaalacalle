import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CLASICOS_OBJETIVO = [
  { cancion: "El Trampolín", artista: "El Gran Combo de Puerto Rico", orden: 1 },
  { cancion: "La Noche Más Linda", artista: "Adalberto Santiago", orden: 2 },
  { cancion: "Cali Pachanguero", artista: "Grupo Niche", orden: 3 },
  { cancion: "La Rebelión", artista: "Joe Arroyo", orden: 4 },
  { cancion: "Pedro Navaja", artista: "Rubén Blades", orden: 5 },
  { cancion: "Llorarás", artista: "Oscar D'León", orden: 6 },
  { cancion: "El Cantante", artista: "Héctor Lavoe", orden: 7 },
];

export async function GET() {
  const existentes = await prisma.cancionClasica.findMany();
  const existentesPorNombre = new Map(existentes.map((c) => [c.cancion, c]));
  const nombresObjetivo = new Set(CLASICOS_OBJETIVO.map((c) => c.cancion));

  const faltantes = CLASICOS_OBJETIVO.filter((c) => !existentesPorNombre.has(c.cancion));
  const sobrantes = existentes.filter((c) => !nombresObjetivo.has(c.cancion));

  // Sincroniza con la lista objetivo solo si hace falta, conservando los
  // votos de las canciones que ya estaban (por nombre) y sin tocar la base
  // de datos en cada carga cuando ya está al día.
  if (faltantes.length > 0 || sobrantes.length > 0) {
    if (faltantes.length > 0) {
      await prisma.cancionClasica.createMany({ data: faltantes });
    }
    if (sobrantes.length > 0) {
      await prisma.cancionClasica.deleteMany({ where: { id: { in: sobrantes.map((c) => c.id) } } });
    }
    await Promise.all(
      CLASICOS_OBJETIVO.map((c) =>
        prisma.cancionClasica.updateMany({ where: { cancion: c.cancion }, data: { orden: c.orden } })
      )
    );
  }

  const clasicos = await prisma.cancionClasica.findMany({ orderBy: { orden: "asc" } });
  return NextResponse.json({ clasicos });
}
