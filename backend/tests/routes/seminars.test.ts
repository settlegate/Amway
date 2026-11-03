import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import seminarRoutes from '../../src/routes/seminars';
import { createUserToken } from '../../src/lib/auth';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));
vi.mock('../../src/lib/crypto', () => ({
  encrypt: (v: string) => `enc:${v}`,
  decrypt: (v: string) => v,
}));

process.env.ADMIN_SESSION_SECRET = 'test-secret';

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(seminarRoutes);
const auth = { Authorization: `Bearer ${createUserToken('u1')}` };
const PHONE = '010-1234-5678';

function mockSeminarExists() {
  prisma.seminar.findUnique.mockResolvedValue({ id: 's1', maxAttendees: 20 });
  prisma.seminarApplication.count.mockResolvedValue(0);
  prisma.seminarApplication.findFirst.mockResolvedValue(null);
}

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
  it.each([{ name: '홍길동' }, { phone: PHONE }])('이름·연락처가 없으면 400을 반환한다 (%o)', async (body) => {
    expect((await request(app).post('/s1/apply').send(body)).status).toBe(400);
  });

  it.each(['010', 'abc', '12345'])('전화번호 형식이 틀리면 400을 반환한다 (%s)', async (phone) => {
    const res = await request(app).post('/s1/apply').send({ name: '홍길동', phone });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('전화번호');
  });

  it('세미나가 없으면 404를 반환한다', async () => {
    prisma.seminar.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/none/apply').send({ name: '홍길동', phone: PHONE });

    expect(res.status).toBe(404);
    expect(prisma.seminarApplication.create).not.toHaveBeenCalled();
  });

  it('정원이 차면 409를 반환한다', async () => {
    prisma.seminar.findUnique.mockResolvedValue({ id: 's1', maxAttendees: 2 });
    prisma.seminarApplication.count.mockResolvedValue(2);

    const res = await request(app).post('/s1/apply').send({ name: '홍길동', phone: PHONE });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('정원');
    expect(prisma.seminarApplication.create).not.toHaveBeenCalled();
  });

  it('같은 회원이 중복 신청하면 409를 반환한다', async () => {
    mockSeminarExists();
    prisma.seminarApplication.findFirst.mockResolvedValue({ id: 'a0' });

    const res = await request(app).post('/s1/apply').set(auth).send({ name: '홍길동', phone: PHONE });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('이미 신청');
    expect(prisma.seminarApplication.create).not.toHaveBeenCalled();
  });

  it('토큰 없이 신청하면 본문 userId를 무시하고 null로 저장한다', async () => {
    mockSeminarExists();
    prisma.seminarApplication.create.mockResolvedValue({ id: 'a1' });

    const res = await request(app).post('/s1/apply').send({ userId: 'victim', name: '홍길동', phone: PHONE });

    expect(res.body).toMatchObject({ id: 'a1', name: '홍길동', phone: PHONE });
    expect(prisma.seminarApplication.create).toHaveBeenCalledWith({
      data: { userId: null, seminarId: 's1', name: 'enc:홍길동', phone: `enc:${PHONE}`, status: 'PENDING' },
    });
  });

  it('이름과 연락처는 암호화 함수를 거쳐 저장하고 응답에는 평문을 돌려준다', async () => {
    mockSeminarExists();
    prisma.seminarApplication.create.mockResolvedValue({ id: 'a2' });

    const res = await request(app).post('/s1/apply').send({ name: '홍길동', phone: PHONE });

    const { name, phone } = prisma.seminarApplication.create.mock.calls[0][0].data;
    expect(name).toBe('enc:홍길동');
    expect(phone).toBe(`enc:${PHONE}`);
    expect(res.body).toMatchObject({ id: 'a2', name: '홍길동', phone: PHONE });
  });

  it('회원 신청은 세션의 userId를 함께 저장한다 (본문 userId 무시)', async () => {
    mockSeminarExists();

    await request(app).post('/s1/apply').set(auth).send({ userId: 'victim', name: '홍길동', phone: PHONE });

    expect(prisma.seminarApplication.create.mock.calls[0][0].data.userId).toBe('u1');
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    mockSeminarExists();
    prisma.seminarApplication.create.mockRejectedValue(new Error('db'));
    expect((await request(app).post('/s1/apply').send({ name: 'a', phone: PHONE })).status).toBe(500);
  });
});
