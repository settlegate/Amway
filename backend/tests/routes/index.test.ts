import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import routes from '../../src/routes';
import { buildApp } from '../helpers/app';

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
    ['get', '/api/reminders', 400],
    ['get', '/api/seminars', 200],
    ['get', '/api/business/stp', 200],
    ['get', '/api/leads', 200],
    ['post', '/api/consent/agree', 400],
    ['get', '/api/admin/dashboard', 200],
    ['post', '/api/kakao/send', 400],
    ['get', '/api/home-promotion', 200],
  ] as const)('%s %s 경로가 연결되어 있다', async (method, path, status) => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(status);
  });
});
