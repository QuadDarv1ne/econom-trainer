import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const hash = await bcrypt.hash('TestPass123!', 10);
const user = await prisma.user.upsert({
  where: { email: 'test@example.com' },
  update: { passwordHash: hash },
  create: { name: 'E2E Test User', email: 'test@example.com', passwordHash: hash },
});
await prisma.userProgress.upsert({
  where: { userId: user.id },
  update: {},
  create: { userId: user.id, totalXP: 0, level: 1 },
});
console.log('User created/updated:', user.id);
await prisma.$disconnect();
