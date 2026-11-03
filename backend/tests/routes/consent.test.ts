import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import consentRoutes from '../../src/routes/consent';
import { createUserToken } from '../../src/lib/auth';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));

process.env.ADMIN_SESSION_SECRET = 'test-secret';

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(consentRoutes);
const auth = { Authorization: `Bearer ${createUserToken('u1')}` };

describe.each(['/agree', '/withdraw'])('POST %s', (path) => {
  it('토큰이 없으면 401을 반환한다', async () => {
    const res = await request(app).post(path).send({ userId: 'u1' });

    expect(res.status).toBe(401);
    expect(prisma.consent.upsert).not.toHaveBeenCalled();
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.consent.upsert.mockRejectedValue(new Error('db'));

    const res = await request(app).post(path).set(auth).send({});

    expect(res.status).toBe(500);
  });
});

describe('POST /agree', () => {
  it('기본 채널(KAKAO)로 수신 동의를 저장하고 User.isAgreed를 동기화한다', async () => {
    prisma.consent.upsert.mockResolvedValue({ id: 'c1' });

    const res = await request(app).post('/agree').set(auth).send({});

    expect(res.body).toEqual({ ok: true, consent: { id: 'c1' } });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.consent.upsert).toHaveBeenCalledWith({
      where: { userId_channel: { userId: 'u1', channel: 'KAKAO' } },
      update: { isAgreed: true, agreedAt: expect.any(Date), revokedAt: null },
      create: { userId: 'u1', channel: 'KAKAO', isAgreed: true, agreedAt: expect.any(Date) },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { isAgreed: true },
    });
  });

  it('본문의 userId를 보내도 세션의 userId로만 처리된다', async () => {
    prisma.consent.upsert.mockResolvedValue({ id: 'c1' });

    await request(app).post('/agree').set(auth).send({ userId: 'victim' });

    expect(prisma.consent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ userId: 'u1' }) })
    );
  });
});

describe('POST /withdraw', () => {
  it('지정한 채널의 수신 동의를 철회하고 User.isAgreed를 동기화한다', async () => {
    prisma.consent.upsert.mockResolvedValue({ id: 'c1' });

    await request(app).post('/withdraw').set(auth).send({ channel: 'SMS' });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.consent.upsert).toHaveBeenCalledWith({
      where: { userId_channel: { userId: 'u1', channel: 'SMS' } },
      update: { isAgreed: false, revokedAt: expect.any(Date) },
      create: { userId: 'u1', channel: 'SMS', isAgreed: false },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('KAKAO 채널 철회 시 User.isAgreed를 false로 동기화한다', async () => {
    prisma.consent.upsert.mockResolvedValue({ id: 'c1' });

    await request(app).post('/withdraw').set(auth).send({});

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { isAgreed: false },
    });
  });
});
