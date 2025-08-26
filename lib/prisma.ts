import { PrismaClient } from '@prisma/client';

// Mencegah multiple instance Prisma Client di environment development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;