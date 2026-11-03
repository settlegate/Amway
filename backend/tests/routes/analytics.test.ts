import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import analyticsRoutes from '../../src/routes/analytics';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));

const prisma = prismaImport as unknown as PrismaMock;
const app = buildApp(analyticsRoutes);

const VISITOR_ID = 'visitor-0123456789';

describe('POST /track', () => {
  it.each([
    [{}, 'visitorId 누락'],
    [{ visitorId: 'x', path: '/' }, 'visitorId 형식 오류'],
    [{ visitorId: VISITOR_ID }, 'path 누락'],
    [{ visitorId: VISITOR_ID, path: 'https://evil.test' }, 'path 형식 오류'],
  ])('입력이 올바르지 않으면 400을 반환한다 (%s)', async (body) => {
    const res = await request(app).post('/track').send(body as object);
    expect(res.status).toBe(400);
    expect(prisma.pageView.create).not.toHaveBeenCalled();
  });

  it('페이지뷰를 저장한다', async () => {
    prisma.pageView.create.mockResolvedValue({ id: 'v1' });

    const res = await request(app)
      .post('/track')
      .send({ visitorId: VISITOR_ID, path: '/products' });

    expect(res.status).toBe(201);
    expect(prisma.pageView.create).toHaveBeenCalledWith({
      data: {
        visitorId: VISITOR_ID,
        userId: null,
        type: 'pageview',
        day: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        path: '/products',
        contentType: null,
        contentId: null,
        contentName: null,
      },
    });
  });

  it('type=pageview이면 콘텐츠 필드는 무시된다', async () => {
    await request(app).post('/track').send({
      visitorId: VISITOR_ID,
      path: '/',
      contentType: 'product',
      contentId: 'p1',
    });

    expect(prisma.pageView.create.mock.calls[0][0].data).toMatchObject({
      type: 'pageview',
      contentType: null,
      contentId: null,
    });
  });

  it.each([
    [{ visitorId: VISITOR_ID, path: '/', type: 'content' }, 'contentType 누락'],
    [
      { visitorId: VISITOR_ID, path: '/', type: 'content', contentType: 'product' },
      'contentId 누락',
    ],
    [
      {
        visitorId: VISITOR_ID,
        path: '/',
        type: 'content',
        contentType: 'unknown',
        contentId: 'x1',
      },
      '허용되지 않은 contentType',
    ],
  ])('콘텐츠 뷰 입력이 올바르지 않으면 400을 반환한다 (%s)', async (body) => {
    const res = await request(app).post('/track').send(body as object);
    expect(res.status).toBe(400);
    expect(prisma.pageView.create).not.toHaveBeenCalled();
  });

  it('콘텐츠 뷰를 저장한다', async () => {
    prisma.pageView.create.mockResolvedValue({ id: 'v1' });

    const res = await request(app).post('/track').send({
      visitorId: VISITOR_ID,
      path: '/',
      type: 'content',
      contentType: 'product',
      contentId: '120843K',
      contentName: '더블엑스',
    });

    expect(res.status).toBe(201);
    expect(prisma.pageView.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        visitorId: VISITOR_ID,
        type: 'content',
        path: '/',
        contentType: 'product',
        contentId: '120843K',
        contentName: '더블엑스',
      }),
    });
  });

  it('DB 오류는 500을 반환한다', async () => {
    prisma.pageView.create.mockRejectedValue(new Error('db'));

    const res = await request(app)
      .post('/track')
      .send({ visitorId: VISITOR_ID, path: '/' });

    expect(res.status).toBe(500);
  });
});
