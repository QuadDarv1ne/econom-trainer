// База данных пока не используется — проект работает на localStorage (Zustand)
// При переходе на серверную синхронизацию раскомментируйте Prisma-клиент

// import { PrismaClient } from '@prisma/client'
// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
// export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })
// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export {}