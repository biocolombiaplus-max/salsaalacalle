import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const nombre = process.env.ADMIN_NOMBRE || "Administrador";

  if (!email || !password) {
    console.error(
      "Define ADMIN_EMAIL y ADMIN_PASSWORD en tu archivo .env antes de ejecutar este script."
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash, nombre },
    update: { passwordHash, nombre },
  });

  console.log(`Administrador listo: ${admin.email}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
