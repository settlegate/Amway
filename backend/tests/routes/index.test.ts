import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import routes from '../../src/routes';
import { createAdminToken, createUserToken } from '../../src/lib/auth';
import { buildApp } from '../helpers/app';

process.env.ADMIN_SESSION_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD = 'test-password';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));
vi.mock('../../src/lib/ai', () => ({ analyzeBodyImage: vi.fn(), generateHealthReply: vi.fn() }));
vi.mock('../../src/lib/vector', () => ({ searchProducts: vi.fn() }));
vi.mock('../../src/lib/amwayProduct', () => ({ syncProductFromUrl: vi.fn(), syncAllProducts: vi.fn() }));
vi.mock('../../src/lib/kakao', () => ({ handleKakaoWebhook: vi.fn(), sendFriendTalk: vi.fn() }));
vi.mock('../../src/lib/upload', () => ({
  uploadPromo: { single: () => (_req: any, _res: any, next: any) => next() },
}));

const app = buildApp(routes, '/api');

describe('API 라우터', () => {
  it.each([
    ['post', '/api/chat', 400],
    ['get', '/api/products', 200],
    ['get', '/api/seminars', 200],
    ['get', '/api/business/stp', 200],
    ['get', '/api/home-promotion', 200],
    ['post', '/api/kakao/webhook', 200],
  ] as const)('%s %s 경로가 인증 없이 연결되어 있다', async (method, path, status) => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(status);
  });

  it.each([
    ['get', '/api/reminders'],
    ['post', '/api/reminders'],
    ['post', '/api/consent/agree'],
    ['post', '/api/consent/withdraw'],
  ] as const)('%s %s 는 사용자 세션 없이 401을 반환한다', async (method, path) => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(401);
  });

  it('사용자 세션 토큰으로 보호된 사용자 경로에 접근된다', async () => {
    const res = await request(app)
      .get('/api/reminders')
      .set('Authorization', `Bearer ${createUserToken('u1')}`);
    expect(res.status).not.toBe(401);
  });

  it.each([
    ['get', '/api/leads'],
    ['patch', '/api/leads/l1'],
    ['get', '/api/admin/dashboard'],
    ['get', '/api/admin/products'],
    ['post', '/api/admin/products/sync'],
    ['get', '/api/admin/home-promotions'],
    ['post', '/api/kakao/send'],
  ] as const)('%s %s 는 인증 없이 401을 반환한다', async (method, path) => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(401);
  });

  it.each([
    ['get', '/api/leads', 200],
    ['get', '/api/admin/dashboard', 200],
    ['post', '/api/kakao/send', 400],
  ] as const)('%s %s 는 유효한 토큰으로 접근된다', async (method, path, status) => {
    const res = await request(app)[method](path)
      .set('Authorization', `Bearer ${createAdminToken()}`)
      .send({});
    expect(res.status).toBe(status);
  });
});
