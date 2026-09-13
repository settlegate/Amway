import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import reminderRoutes from '../../src/routes/reminders';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(reminderRoutes);

describe('GET /', () => {
  it('userId가 없으면 400을 반환한다', async () => {
    expect((await request(app).get('/')).status).toBe(400);
  });

  it('사용자의 리마인더 목록을 반환한다', async () => {
    prisma.reminder.findMany.mockResolvedValue([{ id: 'r1' }]);

    const res = await request(app).get('/').query({ userId: 'u1' });

    expect(res.body).toEqual([{ id: 'r1' }]);
    expect(prisma.reminder.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.reminder.findMany.mockRejectedValue(new Error('db'));
    expect((await request(app).get('/').query({ userId: 'u1' })).status).toBe(500);
  });
});

describe('POST /', () => {
  it.each([
    { productName: 'A', intakeTime: '09:00' },
    { userId: 'u1', intakeTime: '09:00' },
    { userId: 'u1', productName: 'A' },
  ])('필수 값이 없으면 400을 반환한다 (%o)', async (body) => {
    expect((await request(app).post('/').send(body)).status).toBe(400);
  });

  it('리마인더를 생성한다', async () => {
    prisma.reminder.create.mockResolvedValue({ id: 'r1' });

    const res = await request(app).post('/').send({
      userId: 'u1',
      productId: 'p1',
      productName: '더블엑스',
      dosage: '1포',
      intakeTime: '09:00',
      cycleDays: '60',
    });

    expect(res.body).toEqual({ id: 'r1' });
    expect(prisma.reminder.create).toHaveBeenCalledWith({
      data: { userId: 'u1', productId: 'p1', productName: '더블엑스', dosage: '1포', intakeTime: '09:00', cycleDays: 60 },
    });
  });

  it('제품 ID와 주기가 없으면 기본값을 사용한다', async () => {
    await request(app).post('/').send({ userId: 'u1', productName: 'A', intakeTime: '09:00' });

    expect(prisma.reminder.create.mock.calls[0][0].data).toMatchObject({ productId: null, cycleDays: 30 });
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.reminder.create.mockRejectedValue(new Error('db'));

    const res = await request(app).post('/').send({ userId: 'u1', productName: 'A', intakeTime: '09:00' });

    expect(res.status).toBe(500);
  });
});
