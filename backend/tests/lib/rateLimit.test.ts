import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { chatLimiter, imageChatLimiter } from '../../src/lib/rateLimit';

describe('rate limit', () => {
  it('채팅 한도(분당 10회)를 넘으면 429를 반환한다', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const app = express();
    app.use(express.json());
    app.post('/chat', chatLimiter, (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 10; i++) {
      expect((await request(app).post('/chat').send({})).status).toBe(200);
    }
    const res = await request(app).post('/chat').send({});
    expect(res.status).toBe(429);
  });

  it('이미지가 없는 요청은 이미지 분석 한도를 소비하지 않는다', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const app = express();
    app.use(express.json());
    app.post('/chat', imageChatLimiter, (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 25; i++) {
      expect((await request(app).post('/chat').send({ message: 'hi' })).status).toBe(200);
    }
  });

  it('테스트 환경에서는 제한을 건너뛴다', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const app = express();
    app.use(express.json());
    app.post('/chat', chatLimiter, (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 15; i++) {
      expect((await request(app).post('/chat').send({})).status).toBe(200);
    }
  });
});
