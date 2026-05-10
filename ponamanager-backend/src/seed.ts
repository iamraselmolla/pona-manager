// src/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const hashed = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@ponatrack.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@ponatrack.com', password: hashed, role: 'admin' },
  });

  // Sample customers
  const customers = [
    { name: 'রহিম মিয়া', mobile: '01711234567', address: 'পটুয়াখালী', area: 'বাউফল' },
    { name: 'করিম শেখ', mobile: '01811234568', address: 'বরগুনা', area: 'আমতলী' },
    { name: 'জসিম উদ্দিন', mobile: '01911234569', address: 'পিরোজপুর', area: 'মঠবাড়িয়া' },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { mobile: c.mobile },
      update: {},
      create: c,
    });
  }

  console.log('✅ Seed completed!');
  console.log('📧 Login: admin@ponatrack.com | 🔑 Password: admin123');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
