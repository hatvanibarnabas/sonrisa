import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin12345", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      name: "Admin",
      isAdmin: true,
    },
  });

  console.log("Seeded admin user: admin@example.com / admin12345");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
