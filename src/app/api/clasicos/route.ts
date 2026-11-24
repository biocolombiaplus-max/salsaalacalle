import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CLASICOS_SEMILLA = [
  { cancion: "La Rebelión", artista: "Joe Arroyo", orden: 1 },
  { cancion: "Pedro Navaja", artista: "Rubén Blades", orden: 2 },
  { cancion: "Vivir Mi Vida", artista: "Marc Anthony", orden: 3 },
  { cancion: "El Cantante", artista: "Héctor Lavoe", orden: 4 },
  { cancion: "Llorarás", artista: "Oscar D'León", orden: 5 },
];

export async function GET() {
  let clasicos = await prisma.cancionClasica.findMany({ orderBy: { orden: "asc" } });
  if (clasicos.length === 0) {
    await prisma.cancionClasica.createMany({ data: CLASICOS_SEMILLA });
    clasicos = await prisma.cancionClasica.findMany({ orderBy: { orden: "asc" } });
  }
  return NextResponse.json({ clasicos });
}
