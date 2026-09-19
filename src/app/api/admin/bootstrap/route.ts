import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

/**
 * Crea el primer usuario administrador usando ADMIN_EMAIL/ADMIN_PASSWORD.
 * Es idempotente y seguro de visitar más de una vez: si ya existe algún
 * administrador, no hace nada (para evitar resetear credenciales por
 * accidente visitando la URL de nuevo).
 */
export async function GET() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Define ADMIN_EMAIL y ADMIN_PASSWORD en las variables de entorno." },
      { status: 400 }
    );
  }

  const existingCount = await prisma.adminUser.count();
  if (existingCount > 0) {
    return NextResponse.json({
      ok: true,
      message: "Ya existe al menos un administrador. No se hizo ningún cambio.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.create({
    data: { email, passwordHash, nombre: "Administrador" },
  });

  return NextResponse.json({
    ok: true,
    message: `Administrador creado: ${email}. Ya puedes borrar esta ruta.`,
  });
}
