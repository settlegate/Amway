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
  groupBy: vi.fn(),
});

// `vi.mock('.../src/lib/db', () => import('../helpers/prismaMock'))` 형태로 사용
export const prisma = {
  $transaction: vi.fn((ops: any) => (Array.isArray(ops) ? Promise.all(ops) : ops(prisma))),
  user: model(),
  consent: model(),
  product: model(),
  promotion: model(),
  reminder: model(),
  seminar: model(),
  seminarApplication: model(),
  lead: model(),
  homePromotion: model(),
  pageView: model(),
};

export type PrismaMock = typeof prisma;
