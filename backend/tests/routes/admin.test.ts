import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import adminRoutes from '../../src/routes/admin';
import { prisma as prismaImport } from '../../src/lib/db';
import { syncAllProducts, syncProductFromUrl } from '../../src/lib/amwayProduct';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp, prismaError } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));
vi.mock('../../src/lib/amwayProduct', () => ({ syncProductFromUrl: vi.fn(), syncAllProducts: vi.fn() }));
vi.mock('../../src/lib/upload', () => ({
  uploadPromo: { single: () => (_req: any, _res: any, next: any) => next() },
}));

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(adminRoutes);
const PRODUCT_SELECT = { product: { select: { id: true, code: true, name: true } } };

describe('GET /dashboard', () => {
  it('집계 수치와 후속 상담 리드를 반환한다', async () => {
    prisma.user.count.mockResolvedValue(3);
    prisma.lead.count.mockResolvedValue(2);
    prisma.seminar.count.mockResolvedValue(1);
    prisma.lead.findMany.mockResolvedValue([{ id: 'l1' }]);

    const res = await request(app).get('/dashboard');

    expect(res.body).toEqual({
      counts: { userCount: 3, leadCount: 2, seminarCount: 1 },
      followUpLeads: [{ id: 'l1' }],
    });
    expect(prisma.lead.findMany).toHaveBeenCalledWith({
      where: { status: 'FOLLOW_UP' },
      orderBy: { followUpAt: 'asc' },
      take: 20,
      include: { user: true },
    });
  });

  it('DB 오류가 나면 500을 반환한다', async () => {
    prisma.user.count.mockRejectedValue(new Error('db'));
    expect((await request(app).get('/dashboard')).status).toBe(500);
  });
});

describe('제품 동기화', () => {
  it('GET /products 는 활성 프로모션을 포함한 제품 목록을 반환한다', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'p1' }]);

    const res = await request(app).get('/products');

    expect(res.body).toEqual([{ id: 'p1' }]);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      orderBy: [{ isActive: 'desc' }, { salesVolume: 'desc' }, { name: 'asc' }],
      include: { promotions: { where: { isActive: true } } },
    });
  });

  it('GET /products DB 오류는 500을 반환한다', async () => {
    prisma.product.findMany.mockRejectedValue(new Error('db'));
    expect((await request(app).get('/products')).status).toBe(500);
  });

  it('POST /products/sync 는 url이 없으면 400을 반환한다', async () => {
    const res = await request(app).post('/products/sync').send({});
    expect(res.status).toBe(400);
  });

  it('POST /products/sync 는 단일 URL을 동기화한다', async () => {
    vi.mocked(syncProductFromUrl).mockResolvedValue({ name: '더블엑스' } as any);

    const res = await request(app).post('/products/sync').send({ url: 'https://a', code: 'C', category: '비타민' });

    expect(res.body).toEqual({ name: '더블엑스' });
    expect(syncProductFromUrl).toHaveBeenCalledWith('https://a', { code: 'C', category: '비타민' });
  });

  it.each([
    [new Error('파싱 실패'), '파싱 실패'],
    [new Error(''), '제품 동기화 중 오류가 발생했습니다.'],
  ])('POST /products/sync 오류는 500과 메시지를 반환한다', async (error, message) => {
    vi.mocked(syncProductFromUrl).mockRejectedValue(error);

    const res = await request(app).post('/products/sync').send({ url: 'https://a' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe(message);
  });

  it('POST /products/sync-all 은 동기화 건수와 결과를 반환한다', async () => {
    vi.mocked(syncAllProducts).mockResolvedValue([{ name: 'a' }, { name: 'b' }] as any);

    const res = await request(app).post('/products/sync-all');

    expect(res.body).toEqual({ synced: 2, results: [{ name: 'a' }, { name: 'b' }] });
  });

  it.each([
    [new Error('timeout'), 'timeout'],
    [new Error(''), '전체 제품 동기화 중 오류가 발생했습니다.'],
  ])('POST /products/sync-all 오류는 500과 메시지를 반환한다', async (error, message) => {
    vi.mocked(syncAllProducts).mockRejectedValue(error);

    const res = await request(app).post('/products/sync-all');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe(message);
  });
});

describe('프로모션 관리', () => {
  it('GET /promotions 는 목록을 반환한다', async () => {
    prisma.promotion.findMany.mockResolvedValue([{ id: 'pr1' }]);

    const res = await request(app).get('/promotions');

    expect(res.body).toEqual([{ id: 'pr1' }]);
    expect(prisma.promotion.findMany).toHaveBeenCalledWith({
      include: PRODUCT_SELECT,
      orderBy: [{ isActive: 'desc' }, { endAt: 'asc' }, { createdAt: 'desc' }],
    });
  });

  it('GET /promotions DB 오류는 500을 반환한다', async () => {
    prisma.promotion.findMany.mockRejectedValue(new Error('db'));
    expect((await request(app).get('/promotions')).status).toBe(500);
  });

  it('POST /promotions 는 title이 없으면 400을 반환한다', async () => {
    expect((await request(app).post('/promotions').send({})).status).toBe(400);
  });

  it('POST /promotions 는 모든 필드를 변환해 저장한다', async () => {
    prisma.promotion.create.mockResolvedValue({ id: 'pr1' });

    await request(app).post('/promotions').send({
      title: '추석',
      description: '설명',
      productId: 'p1',
      startAt: '2026-09-01',
      endAt: '2026-09-30',
      isActive: false,
    });

    expect(prisma.promotion.create).toHaveBeenCalledWith({
      data: {
        title: '추석',
        description: '설명',
        productId: 'p1',
        startAt: new Date('2026-09-01'),
        endAt: new Date('2026-09-30'),
        isActive: false,
      },
      include: PRODUCT_SELECT,
    });
  });

  it('POST /promotions 는 선택 필드를 기본값으로 저장한다', async () => {
    await request(app).post('/promotions').send({ title: '추석' });

    expect(prisma.promotion.create.mock.calls[0][0].data).toEqual({
      title: '추석',
      description: null,
      productId: null,
      startAt: null,
      endAt: null,
      isActive: true,
    });
  });

  it('POST /promotions DB 오류는 500을 반환한다', async () => {
    prisma.promotion.create.mockRejectedValue(new Error('db'));
    expect((await request(app).post('/promotions').send({ title: 't' })).status).toBe(500);
  });

  it('PUT /promotions/:id 는 전달된 값을 변환해 수정한다', async () => {
    prisma.promotion.update.mockResolvedValue({ id: 'pr1' });

    const res = await request(app).put('/promotions/pr1').send({
      title: '수정',
      description: '',
      productId: '',
      startAt: '',
      endAt: '2026-10-01',
      isActive: 0,
    });

    expect(res.body).toEqual({ id: 'pr1' });
    expect(prisma.promotion.update).toHaveBeenCalledWith({
      where: { id: 'pr1' },
      data: {
        title: '수정',
        description: '',
        productId: null,
        startAt: null,
        endAt: new Date('2026-10-01'),
        isActive: false,
      },
      include: PRODUCT_SELECT,
    });
  });

  it('PUT /promotions/:id 는 전달하지 않은 값은 변경하지 않는다', async () => {
    await request(app).put('/promotions/pr1').send({ productId: 'p2', startAt: '2026-09-01' });

    expect(prisma.promotion.update.mock.calls[0][0].data).toEqual({
      title: undefined,
      description: undefined,
      productId: 'p2',
      startAt: new Date('2026-09-01'),
      endAt: undefined,
      isActive: undefined,
    });
  });

  it.each([
    [prismaError('P2025'), 404],
    [new Error('db'), 500],
  ])('PUT /promotions/:id 오류 처리', async (error, status) => {
    prisma.promotion.update.mockRejectedValue(error);
    expect((await request(app).put('/promotions/pr1').send({})).status).toBe(status);
  });

  it('DELETE /promotions/:id 는 프로모션을 삭제한다', async () => {
    const res = await request(app).delete('/promotions/pr1');

    expect(res.body).toEqual({ ok: true });
    expect(prisma.promotion.delete).toHaveBeenCalledWith({ where: { id: 'pr1' } });
  });

  it.each([
    [prismaError('P2025'), 404],
    [new Error('db'), 500],
  ])('DELETE /promotions/:id 오류 처리', async (error, status) => {
    prisma.promotion.delete.mockRejectedValue(error);
    expect((await request(app).delete('/promotions/pr1')).status).toBe(status);
  });
});

describe('세미나 관리', () => {
  it('GET /seminars 는 날짜순 목록을 반환한다', async () => {
    prisma.seminar.findMany.mockResolvedValue([{ id: 's1' }]);

    const res = await request(app).get('/seminars');

    expect(res.body).toEqual([{ id: 's1' }]);
    expect(prisma.seminar.findMany).toHaveBeenCalledWith({ orderBy: { date: 'asc' } });
  });

  it('GET /seminars DB 오류는 500을 반환한다', async () => {
    prisma.seminar.findMany.mockRejectedValue(new Error('db'));
    expect((await request(app).get('/seminars')).status).toBe(500);
  });

  it.each([{ title: 't' }, { date: '2026-09-01' }])('POST /seminars 필수 값 누락은 400 (%o)', async (body) => {
    expect((await request(app).post('/seminars').send(body)).status).toBe(400);
  });

  it('POST /seminars 는 세미나를 생성한다', async () => {
    prisma.seminar.create.mockResolvedValue({ id: 's1' });

    await request(app).post('/seminars').send({
      title: '세미나',
      description: '설명',
      date: '2026-09-01T10:00:00.000Z',
      location: '강남',
      maxAttendees: '30',
    });

    expect(prisma.seminar.create).toHaveBeenCalledWith({
      data: {
        title: '세미나',
        description: '설명',
        date: new Date('2026-09-01T10:00:00.000Z'),
        location: '강남',
        maxAttendees: 30,
      },
    });
  });

  it('POST /seminars 는 선택 필드를 기본값으로 채운다', async () => {
    await request(app).post('/seminars').send({ title: '세미나', date: '2026-09-01', maxAttendees: 'abc' });

    expect(prisma.seminar.create.mock.calls[0][0].data).toMatchObject({
      description: null,
      location: null,
      maxAttendees: 20,
    });
  });

  it('POST /seminars DB 오류는 500을 반환한다', async () => {
    prisma.seminar.create.mockRejectedValue(new Error('db'));
    expect((await request(app).post('/seminars').send({ title: 't', date: '2026-09-01' })).status).toBe(500);
  });

  it('DELETE /seminars/:id 는 세미나를 삭제한다', async () => {
    const res = await request(app).delete('/seminars/s1');

    expect(res.body).toEqual({ ok: true });
    expect(prisma.seminar.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
  });

  it.each([
    [prismaError('P2025'), 404],
    [new Error('db'), 500],
  ])('DELETE /seminars/:id 오류 처리', async (error, status) => {
    prisma.seminar.delete.mockRejectedValue(error);
    expect((await request(app).delete('/seminars/s1')).status).toBe(status);
  });
});

describe('홈 프로모션 배너', () => {
  it('/home-promotions 하위 라우터를 연결한다', async () => {
    prisma.homePromotion.findMany.mockResolvedValue([]);

    const res = await request(app).get('/home-promotions');

    expect(res.status).toBe(200);
    expect(prisma.homePromotion.findMany).toHaveBeenCalled();
  });
});
