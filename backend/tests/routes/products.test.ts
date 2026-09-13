import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import productRoutes from '../../src/routes/products';
import { prisma as prismaImport } from '../../src/lib/db';
import { searchProducts } from '../../src/lib/vector';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));
vi.mock('../../src/lib/vector', () => ({ searchProducts: vi.fn() }));

const prisma = prismaImport as unknown as PrismaMock;
const search = vi.mocked(searchProducts);
const app = buildApp(productRoutes);

describe('GET /', () => {
  it('검색어로 제품을 검색한다', async () => {
    search.mockResolvedValue([{ id: 'p1' }] as any);

    const res = await request(app).get('/').query({ q: '피로' });

    expect(res.body).toEqual([{ id: 'p1' }]);
    expect(search).toHaveBeenCalledWith('피로');
  });

  it.each(['', '?q=a&q=b'])('검색어가 문자열이 아니면 빈 검색어를 사용한다 (%s)', async (qs) => {
    search.mockResolvedValue([]);

    await request(app).get(`/${qs}`);

    expect(search).toHaveBeenCalledWith('');
  });

  it('검색 오류가 나면 500을 반환한다', async () => {
    search.mockRejectedValue(new Error('fail'));
    expect((await request(app).get('/')).status).toBe(500);
  });
});

describe('GET /:id', () => {
  it('프로모션을 포함한 제품 상세를 반환한다', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1' });

    const res = await request(app).get('/p1');

    expect(res.body).toEqual({ id: 'p1' });
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'p1' },
      include: { promotions: { orderBy: { createdAt: 'desc' } } },
    });
  });

  it('제품이 없으면 404를 반환한다', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    expect((await request(app).get('/nope')).status).toBe(404);
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.product.findUnique.mockRejectedValue(new Error('db'));
    expect((await request(app).get('/p1')).status).toBe(500);
  });
});
