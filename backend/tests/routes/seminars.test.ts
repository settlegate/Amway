import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import seminarRoutes from '../../src/routes/seminars';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));
vi.mock('../../src/lib/crypto', () => ({
  encrypt: (v: string) => `enc:${v}`,
  decrypt: (v: string) => v,
}));

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(seminarRoutes);

describe('GET /', () => {
  it('세미나 목록을 날짜순으로 반환한다', async () => {
    prisma.seminar.findMany.mockResolvedValue([{ id: 's1' }]);

    const res = await request(app).get('/');

    expect(res.body).toEqual([{ id: 's1' }]);
    expect(prisma.seminar.findMany).toHaveBeenCalledWith({ orderBy: { date: 'asc' } });
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.seminar.findMany.mockRejectedValue(new Error('db'));
    expect((await request(app).get('/')).status).toBe(500);
  });
});

describe('POST /:id/apply', () => {
  it.each([{ name: '홍길동' }, { phone: '010' }])('이름·연락처가 없으면 400을 반환한다 (%o)', async (body) => {
    expect((await request(app).post('/s1/apply').send(body)).status).toBe(400);
  });

  it('비회원 신청은 userId를 null로 저장한다', async () => {
    prisma.seminarApplication.create.mockResolvedValue({ id: 'a1' });

    const res = await request(app).post('/s1/apply').send({ name: '홍길동', phone: '010' });

    expect(res.body).toMatchObject({ id: 'a1', name: '홍길동', phone: '010' });
    expect(prisma.seminarApplication.create).toHaveBeenCalledWith({
      data: { userId: null, seminarId: 's1', name: 'enc:홍길동', phone: 'enc:010', status: 'PENDING' },
    });
  });

  it('이름과 연락처는 암호화 함수를 거쳐 저장하고 응답에는 평문을 돌려준다', async () => {
    prisma.seminarApplication.create.mockResolvedValue({ id: 'a2' });

    const res = await request(app).post('/s1/apply').send({ name: '홍길동', phone: '010' });

    const { name, phone } = prisma.seminarApplication.create.mock.calls[0][0].data;
    expect(name).toBe('enc:홍길동');
    expect(phone).toBe('enc:010');
    expect(res.body).toMatchObject({ id: 'a2', name: '홍길동', phone: '010' });
  });

  it('회원 신청은 userId를 함께 저장한다', async () => {
    await request(app).post('/s1/apply').send({ userId: 'u1', name: '홍길동', phone: '010' });

    expect(prisma.seminarApplication.create.mock.calls[0][0].data.userId).toBe('u1');
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.seminarApplication.create.mockRejectedValue(new Error('db'));
    expect((await request(app).post('/s1/apply').send({ name: 'a', phone: 'b' })).status).toBe(500);
  });
});
