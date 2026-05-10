// src/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const users = [
  {
    name: "Emadadul Haq",
    email: "emadadul@ponatrack.com",
    phone: "01712773044",
    password: "pona1234",
    role: "admin",
  },
  {
    name: "Md Rasel Molla",
    email: "rasel@ponatrack.com",
    phone: "01944835365",
    password: "pona1234",
    role: "admin",
  },
];

async function main() {
  console.log("🌱 Seeding users...\n");

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);

    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phone: u.phone,
        password: hashed,
        role: u.role,
      },
      create: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        password: hashed,
        role: u.role,
      },
    });

    console.log(`✅ ${created.role.toUpperCase().padEnd(6)} → ${created.name}`);
    console.log(`         Email: ${created.email}`);
    console.log(`         Phone: ${created.phone}`);
    console.log(`         Pass:  ${u.password}\n`);
  }

  console.log("─────────────────────────────────────");
  console.log("Login with EMAIL or PHONE + password");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
