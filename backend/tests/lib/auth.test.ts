import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  adminLogin,
  createAdminToken,
  createUserToken,
  optionalUser,
  requireAdmin,
  requireUser,
  resetLoginAttempts,
} from '../../src/lib/auth';

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

describe('사용자 세션 (카카오 웹뷰)', () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.USER_SESSION_SECRET;
  });

  function userApp() {
    const app = express();
    app.use(express.json());
    app.get('/me', requireUser, (req, res) => res.json({ userId: (req as any).userId }));
    app.get('/opt', optionalUser, (req, res) => res.json({ userId: (req as any).userId ?? null }));
    return app;
  }

  it('발급된 사용자 토큰으로 접근하면 세션 userId가 설정된다', async () => {
    const res = await request(userApp())
      .get('/me')
      .set('Authorization', `Bearer ${createUserToken('u1')}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('u1');
  });

  it('토큰이 없거나 변조되면 401을 반환한다', async () => {
    const app = userApp();

    expect((await request(app).get('/me')).status).toBe(401);
    expect(
      (
        await request(app)
          .get('/me')
          .set('Authorization', `Bearer ${createUserToken('u1')}00`)
      ).status
    ).toBe(401);
  });

  it('관리자 토큰은 사용자 토큰으로 인정되지 않는다', async () => {
    const res = await request(userApp())
      .get('/me')
      .set('Authorization', `Bearer ${createAdminToken()}`);

    expect(res.status).toBe(401);
  });

  it('만료된 사용자 토큰은 401을 반환한다', async () => {
    const expired = createUserToken('u1', Date.now() - 3 * 60 * 60 * 1000);
    const res = await request(userApp())
      .get('/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });

  it('optionalUser는 토큰이 없어도 통과하고, 있으면 userId를 채운다', async () => {
    const app = userApp();

    expect((await request(app).get('/opt')).body.userId).toBeNull();
    const res = await request(app)
      .get('/opt')
      .set('Authorization', `Bearer ${createUserToken('u2')}`);
    expect(res.body.userId).toBe('u2');
  });
});
