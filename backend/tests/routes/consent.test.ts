import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import consentRoutes from '../../src/routes/consent';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(consentRoutes);

describe.each(['/agree', '/withdraw'])('POST %s', (path) => {
  it('userId가 없으면 400을 반환한다', async () => {
    const res = await request(app).post(path).send({});

    expect(res.status).toBe(400);
    expect(prisma.consent.upsert).not.toHaveBeenCalled();
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.consent.upsert.mockRejectedValue(new Error('db'));

    const res = await request(app).post(path).send({ userId: 'u1' });

    expect(res.status).toBe(500);
  });
});

describe('POST /agree', () => {
  it('기본 채널(KAKAO)로 수신 동의를 저장한다', async () => {
    prisma.consent.upsert.mockResolvedValue({ id: 'c1' });

    const res = await request(app).post('/agree').send({ userId: 'u1' });

    expect(res.body).toEqual({ ok: true, consent: { id: 'c1' } });
    expect(prisma.consent.upsert).toHaveBeenCalledWith({
      where: { userId_channel: { userId: 'u1', channel: 'KAKAO' } },
      update: { isAgreed: true, agreedAt: expect.any(Date), revokedAt: null },
      create: { userId: 'u1', channel: 'KAKAO', isAgreed: true, agreedAt: expect.any(Date) },
    });
  });
});

describe('POST /withdraw', () => {
  it('지정한 채널의 수신 동의를 철회한다', async () => {
    prisma.consent.upsert.mockResolvedValue({ id: 'c1' });

    await request(app).post('/withdraw').send({ userId: 'u1', channel: 'SMS' });

    expect(prisma.consent.upsert).toHaveBeenCalledWith({
      where: { userId_channel: { userId: 'u1', channel: 'SMS' } },
      update: { isAgreed: false, revokedAt: expect.any(Date) },
      create: { userId: 'u1', channel: 'SMS', isAgreed: false },
    });
  });
});
