import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import homePromotionAdmin from '../../src/routes/homePromotionAdmin';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp, prismaError } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));
// 실제 디스크 저장 대신 x-mock-file 헤더로 업로드 파일을 흉내 낸다
vi.mock('../../src/lib/upload', () => ({
  uploadPromo: {
    single: () => (req: any, _res: any, next: any) => {
      const filename = req.headers['x-mock-file'];
      if (filename) req.file = { filename };
      next();
    },
  },
}));

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(homePromotionAdmin);

describe('GET /', () => {
  it('홈 프로모션 목록을 반환한다', async () => {
    prisma.homePromotion.findMany.mockResolvedValue([{ id: 'h1' }]);

    const res = await request(app).get('/');

    expect(res.body).toEqual([{ id: 'h1' }]);
    expect(prisma.homePromotion.findMany).toHaveBeenCalledWith({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.homePromotion.findMany.mockRejectedValue(new Error('db'));
    expect((await request(app).get('/')).status).toBe(500);
  });
});

describe('POST /', () => {
  it('업로드한 파일로 이미지 URL을 만들어 저장한다', async () => {
    prisma.homePromotion.create.mockImplementation(async ({ data }: any) => ({ id: 'h1', ...data }));

    const res = await request(app)
      .post('/')
      .set('x-mock-file', 'promo-1.png')
      .send({ targetUrl: 'https://amway/promo', alt: '추석', isActive: 'true' });

    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/uploads\/promo-1\.png$/);
    expect(res.body).toMatchObject({ targetUrl: 'https://amway/promo', alt: '추석', isActive: true });
  });

  it('파일이 없으면 본문의 imageUrl을 사용한다', async () => {
    prisma.homePromotion.create.mockImplementation(async ({ data }: any) => data);

    const res = await request(app).post('/').send({ imageUrl: 'https://img/a.png', targetUrl: 'https://t' });

    expect(res.body).toEqual({ imageUrl: 'https://img/a.png', targetUrl: 'https://t', alt: null, isActive: false });
  });

  it.each([
    [{ targetUrl: 'https://t' }, '프로모션 이미지가 필요합니다.'],
    [{ imageUrl: 'https://img/a.png' }, '프로모션 링크 URL이 필요합니다.'],
  ])('필수 값이 없으면 400을 반환한다 (%o)', async (body, error) => {
    const res = await request(app).post('/').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(error);
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.homePromotion.create.mockRejectedValue(new Error('db'));

    const res = await request(app).post('/').send({ imageUrl: 'a', targetUrl: 'b' });

    expect(res.status).toBe(500);
  });
});

describe('PUT /:id', () => {
  it('수정할 내용이 없으면 400을 반환한다', async () => {
    const res = await request(app).put('/h1').send({});

    expect(res.status).toBe(400);
    expect(prisma.homePromotion.update).not.toHaveBeenCalled();
  });

  it.each([
    [true, true],
    ['1', true],
    ['on', true],
    ['false', false],
  ])('전달된 필드만 수정한다 (isActive=%s)', async (isActive, expected) => {
    prisma.homePromotion.update.mockResolvedValue({ id: 'h1' });

    const res = await request(app)
      .put('/h1')
      .send({ imageUrl: 'img', targetUrl: 'url', alt: '', isActive });

    expect(res.body).toEqual({ id: 'h1' });
    expect(prisma.homePromotion.update).toHaveBeenCalledWith({
      where: { id: 'h1' },
      data: { imageUrl: 'img', targetUrl: 'url', alt: null, isActive: expected },
    });
  });

  it('일부 필드만 전달하면 해당 필드만 수정한다', async () => {
    await request(app).put('/h1').send({ alt: '설명' });

    expect(prisma.homePromotion.update.mock.calls[0][0].data).toEqual({ alt: '설명' });
  });

  it('대상이 없으면 404를 반환한다', async () => {
    prisma.homePromotion.update.mockRejectedValue(prismaError('P2025'));
    expect((await request(app).put('/h1').send({ alt: 'a' })).status).toBe(404);
  });

  it('그 외 DB 오류는 500을 반환한다', async () => {
    prisma.homePromotion.update.mockRejectedValue(new Error('db'));
    expect((await request(app).put('/h1').send({ alt: 'a' })).status).toBe(500);
  });
});

describe('DELETE /:id', () => {
  it('홈 프로모션을 삭제한다', async () => {
    const res = await request(app).delete('/h1');

    expect(res.body).toEqual({ ok: true });
    expect(prisma.homePromotion.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
  });

  it('대상이 없으면 404를 반환한다', async () => {
    prisma.homePromotion.delete.mockRejectedValue(prismaError('P2025'));
    expect((await request(app).delete('/h1')).status).toBe(404);
  });

  it('그 외 DB 오류는 500을 반환한다', async () => {
    prisma.homePromotion.delete.mockRejectedValue(new Error('db'));
    expect((await request(app).delete('/h1')).status).toBe(500);
  });
});
