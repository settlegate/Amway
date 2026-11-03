import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import reminderRoutes from '../../src/routes/reminders';
import { createUserToken } from '../../src/lib/auth';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));

process.env.ADMIN_SESSION_SECRET = 'test-secret';

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(reminderRoutes);
const auth = { Authorization: `Bearer ${createUserToken('u1')}` };

describe('GET /', () => {
  it('토큰이 없으면 401을 반환한다', async () => {
    const res = await request(app).get('/').query({ userId: 'u1' });

    expect(res.status).toBe(401);
    expect(prisma.reminder.findMany).not.toHaveBeenCalled();
  });

  it('본인의 리마인더 목록을 반환한다 (쿼리 userId는 무시)', async () => {
    prisma.reminder.findMany.mockResolvedValue([{ id: 'r1' }]);

    const res = await request(app).get('/').set(auth).query({ userId: 'victim' });

    expect(res.body).toEqual([{ id: 'r1' }]);
    expect(prisma.reminder.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.reminder.findMany.mockRejectedValue(new Error('db'));
    expect((await request(app).get('/').set(auth)).status).toBe(500);
  });
});

describe('POST /', () => {
  it.each([
    { productName: 'A' },
    { intakeTime: '09:00' },
    {},
  ])('필수 값이 없으면 400을 반환한다 (%o)', async (body) => {
    expect((await request(app).post('/').set(auth).send(body)).status).toBe(400);
  });

  it.each(['9:00', '25:00', '0900', 'aa:bb'])('intakeTime이 HH:MM 형식이 아니면 400을 반환한다 (%s)', async (intakeTime) => {
    const res = await request(app).post('/').set(auth).send({ productName: 'A', intakeTime });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('HH:MM');
    expect(prisma.reminder.create).not.toHaveBeenCalled();
  });

  it('리마인더를 생성한다', async () => {
    prisma.reminder.create.mockResolvedValue({ id: 'r1' });

    const res = await request(app).post('/').set(auth).send({
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

  it('본문의 userId를 보내도 세션의 userId로만 저장된다', async () => {
    prisma.reminder.create.mockResolvedValue({ id: 'r1' });

    await request(app).post('/').set(auth).send({ userId: 'victim', productName: 'A', intakeTime: '09:00' });

    expect(prisma.reminder.create.mock.calls[0][0].data.userId).toBe('u1');
  });

  it('제품 ID와 주기가 없으면 기본값을 사용한다', async () => {
    await request(app).post('/').set(auth).send({ productName: 'A', intakeTime: '09:00' });

    expect(prisma.reminder.create.mock.calls[0][0].data).toMatchObject({ productId: null, cycleDays: 30 });
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.reminder.create.mockRejectedValue(new Error('db'));

    const res = await request(app).post('/').set(auth).send({ productName: 'A', intakeTime: '09:00' });

    expect(res.status).toBe(500);
  });
});
