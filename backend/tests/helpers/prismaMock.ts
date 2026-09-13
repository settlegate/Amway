import { vi } from 'vitest';

const model = () => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
});

// `vi.mock('.../src/lib/db', () => import('../helpers/prismaMock'))` 형태로 사용
export const prisma = {
  user: model(),
  consent: model(),
  product: model(),
  promotion: model(),
  reminder: model(),
  seminar: model(),
  seminarApplication: model(),
  lead: model(),
  homePromotion: model(),
};

export type PrismaMock = typeof prisma;
