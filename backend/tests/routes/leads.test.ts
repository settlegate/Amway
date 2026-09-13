import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import leadRoutes from '../../src/routes/leads';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(leadRoutes);

describe('GET /', () => {
  it('최근 리드 50건을 사용자 정보와 함께 반환한다', async () => {
    prisma.lead.findMany.mockResolvedValue([{ id: 'l1' }]);

    const res = await request(app).get('/');

    expect(res.body).toEqual([{ id: 'l1' }]);
    expect(prisma.lead.findMany).toHaveBeenCalledWith({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.lead.findMany.mockRejectedValue(new Error('db'));
    expect((await request(app).get('/')).status).toBe(500);
  });
});

describe('PATCH /:id', () => {
  it('후속 상담일을 Date로 변환해 저장한다', async () => {
    prisma.lead.update.mockResolvedValue({ id: 'l1' });

    const res = await request(app)
      .patch('/l1')
      .send({ status: 'FOLLOW_UP', notes: '메모', followUpAt: '2026-09-20' });

    expect(res.body).toEqual({ id: 'l1' });
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: { status: 'FOLLOW_UP', notes: '메모', followUpAt: new Date('2026-09-20') },
    });
  });

  it('후속 상담일이 없으면 변경하지 않는다', async () => {
    await request(app).patch('/l1').send({ status: 'DONE' });

    expect(prisma.lead.update.mock.calls[0][0].data.followUpAt).toBeUndefined();
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.lead.update.mockRejectedValue(new Error('db'));
    expect((await request(app).patch('/l1').send({})).status).toBe(500);
  });
});
