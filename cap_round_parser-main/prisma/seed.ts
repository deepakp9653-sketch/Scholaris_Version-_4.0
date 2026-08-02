import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('=== Seeding Database ===');

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@scholaris.edu';
  const password = process.env.ADMIN_SEED_PASSWORD || 'Admin@Scholaris2025';

  const passwordHash = await bcrypt.hash(password, 10);

  // Seed Admin
  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash
    }
  });

  console.log(`✅ Admin seeded successfully: ${admin.email} (ID: ${admin.id})`);

  // Seed Institute
  const institute = await prisma.institute.upsert({
    where: { code: '06649' },
    update: { name: "TSSM's Bhivarabai Sawant College of Engineering and Research, Narhe, Pune" },
    create: {
      code: '06649',
      name: "TSSM's Bhivarabai Sawant College of Engineering and Research, Narhe, Pune"
    }
  });

  console.log(`✅ Institute seeded successfully: ${institute.code} - ${institute.name}`);
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
