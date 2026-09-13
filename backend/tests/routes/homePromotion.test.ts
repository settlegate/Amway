import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import homePromotionRoutes from '../../src/routes/homePromotion';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(homePromotionRoutes);

describe('GET /', () => {
  it('가장 최근의 활성 홈 프로모션을 반환한다', async () => {
    prisma.homePromotion.findFirst.mockResolvedValue({ id: 'h1' });

    const res = await request(app).get('/');

    expect(res.body).toEqual({ id: 'h1' });
    expect(prisma.homePromotion.findFirst).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('프로모션이 없으면 null을 반환한다', async () => {
    prisma.homePromotion.findFirst.mockResolvedValue(undefined);

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.homePromotion.findFirst.mockRejectedValue(new Error('db'));

    const res = await request(app).get('/');

    expect(res.status).toBe(500);
  });
});
