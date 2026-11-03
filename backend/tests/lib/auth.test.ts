import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { adminLogin, createAdminToken, requireAdmin, resetLoginAttempts } from '../../src/lib/auth';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/login', adminLogin);
  app.get('/protected', requireAdmin, (_req, res) => res.json({ ok: true }));
  return app;
}

describe('관리자 인증', () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret';
    process.env.ADMIN_PASSWORD = 'test-password';
    resetLoginAttempts();
  });

  afterEach(() => {
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.ADMIN_PASSWORD;
  });

  it('올바른 비밀번호로 로그인하면 토큰을 반환한다', async () => {
    const res = await request(buildApp()).post('/login').send({ password: 'test-password' });

    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(/^\d+\.[0-9a-f]{64}$/);
  });

  it('발급된 토큰으로 보호된 경로에 접근한다', async () => {
    const app = buildApp();
    const { body } = await request(app).post('/login').send({ password: 'test-password' });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(200);
  });

  it('토큰이 없거나 변조되면 401을 반환한다', async () => {
    const app = buildApp();

    expect((await request(app).get('/protected')).status).toBe(401);
    expect(
      (
        await request(app)
          .get('/protected')
          .set('Authorization', `Bearer ${createAdminToken()}0000`)
      ).status
    ).toBe(401);
  });

  it('만료된 토큰은 401을 반환한다', async () => {
    const expired = createAdminToken(Date.now() - 13 * 60 * 60 * 1000);
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });

  it('잘못된 비밀번호는 401을 반환한다', async () => {
    const res = await request(buildApp()).post('/login').send({ password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('5회 연속 실패하면 429로 잠긴다', async () => {
    const app = buildApp();
    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/login').send({ password: 'wrong' });
    }

    const res = await request(app).post('/login').send({ password: 'test-password' });

    expect(res.status).toBe(429);
  });

  it('세션이 없으면 토큰 검증이 실패한다', async () => {
    delete process.env.ADMIN_SESSION_SECRET;
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${createAdminToken()}`);

    expect(res.status).toBe(401);
  });
});
