import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { initCronJobs } from '../src/lib/cron';

vi.mock('../src/env', () => ({}));
vi.mock('../src/lib/cron', () => ({ initCronJobs: vi.fn() }));
vi.mock('morgan', () => ({ default: () => (_req: any, _res: any, next: any) => next() }));
vi.mock('../src/routes', async () => {
  const { Router } = await import('express');
  const router = Router();
  router.get('/ping', (_req, res) => {
    res.json({ pong: true });
  });
  router.get('/boom', () => {
    throw new Error('boom');
  });
  return { default: router };
});

async function startServer(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  let app: express.Express | undefined;
  const listen = vi.spyOn(express.application, 'listen').mockImplementation(function (this: any, ...args: any[]) {
    app = this;
    args.find((a) => typeof a === 'function')?.();
    return {} as any;
  });
  await import('../src/index');
  return { app: app!, listen };
}

describe('server', () => {
  it('기본 포트로 서버를 시작하고 cron을 초기화한다', async () => {
    const { listen } = await startServer();

    expect(listen).toHaveBeenCalledWith(3001, expect.any(Function));
    expect(initCronJobs).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('http://localhost:3001'));
  });

  it('PORT 환경 변수를 사용한다', async () => {
    const { listen } = await startServer({ PORT: '4000' });
    expect(listen).toHaveBeenCalledWith('4000', expect.any(Function));
  });

  it('/health는 상태와 타임스탬프를 반환한다', async () => {
    const { app } = await startServer();

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('/api 하위에 라우터를 연결한다', async () => {
    const { app } = await startServer();

    const res = await request(app).get('/api/ping');

    expect(res.body).toEqual({ pong: true });
  });

  it('없는 경로는 404를 반환한다', async () => {
    const { app } = await startServer();

    const res = await request(app).get('/unknown');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('처리되지 않은 오류는 500을 반환한다', async () => {
    const { app } = await startServer();

    const res = await request(app).get('/api/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('개발 환경에서는 모든 origin을 허용한다', async () => {
    const { app } = await startServer({ NODE_ENV: 'development' });

    const res = await request(app).get('/health').set('Origin', 'http://evil.test');

    expect(res.headers['access-control-allow-origin']).toBe('http://evil.test');
  });

  it('운영 환경에서는 FRONTEND_URL만 허용한다', async () => {
    const { app } = await startServer({ NODE_ENV: 'production', FRONTEND_URL: 'https://abo.test' });

    const res = await request(app).get('/health').set('Origin', 'http://evil.test');

    expect(res.headers['access-control-allow-origin']).toBe('https://abo.test');
  });

  it('FRONTEND_URL이 없으면 로컬 Vite 주소를 허용한다', async () => {
    const { app } = await startServer({ NODE_ENV: 'production' });

    const res = await request(app).get('/health');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
