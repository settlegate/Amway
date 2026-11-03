import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import kakaoRoutes from '../../src/routes/kakao';
import { handleKakaoWebhook, sendFriendTalk } from '../../src/lib/kakao';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/kakao', () => ({ handleKakaoWebhook: vi.fn(), sendFriendTalk: vi.fn() }));

const app = buildApp(kakaoRoutes);

describe('POST /webhook', () => {
  it('카카오 스킬 응답을 반환한다', async () => {
    vi.mocked(handleKakaoWebhook).mockResolvedValue({ version: '2.0' } as any);

    const res = await request(app).post('/webhook').send({ userRequest: { utterance: '안녕' } });

    expect(res.body).toEqual({ version: '2.0' });
    expect(handleKakaoWebhook).toHaveBeenCalledWith({ userRequest: { utterance: '안녕' } });
  });

  it('처리 중 오류가 나면 500을 반환한다', async () => {
    vi.mocked(handleKakaoWebhook).mockRejectedValue(new Error('fail'));
    expect((await request(app).post('/webhook').send({})).status).toBe(500);
  });

  describe('출처 검증', () => {
    it('비밀값이 설정되면 헤더가 없거나 틀린 요청을 403으로 거부한다', async () => {
      vi.stubEnv('KAKAO_WEBHOOK_SECRET', 's3cret');

      expect((await request(app).post('/webhook').send({})).status).toBe(403);
      expect((await request(app).post('/webhook').set('x-kakao-secret', 'wrong').send({})).status).toBe(403);
      expect(handleKakaoWebhook).not.toHaveBeenCalled();
    });

    it('비밀값이 맞으면 웹훅을 처리한다', async () => {
      vi.stubEnv('KAKAO_WEBHOOK_SECRET', 's3cret');
      vi.mocked(handleKakaoWebhook).mockResolvedValue({ version: '2.0' } as any);

      const res = await request(app).post('/webhook').set('x-kakao-secret', 's3cret').send({});

      expect(res.status).toBe(200);
      expect(handleKakaoWebhook).toHaveBeenCalled();
    });

    it('비밀값 없이 운영 모드면 503으로 거부한다', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('KAKAO_WEBHOOK_SECRET', '');

      expect((await request(app).post('/webhook').send({})).status).toBe(503);
    });
  });
});

describe('POST /send', () => {
  it.each([{ userId: 'u1' }, { message: 'hi' }])('필수 값이 없으면 400을 반환한다 (%o)', async (body) => {
    expect((await request(app).post('/send').send(body)).status).toBe(400);
  });

  it('친구톡을 발송한다', async () => {
    vi.mocked(sendFriendTalk).mockResolvedValue({ ok: true, mock: true });

    const res = await request(app).post('/send').send({ userId: 'u1', message: 'hi', templateCode: 'tpl' });

    expect(res.body).toEqual({ ok: true, mock: true });
    expect(sendFriendTalk).toHaveBeenCalledWith('u1', 'hi', 'tpl');
  });

  it('발송 중 오류가 나면 500을 반환한다', async () => {
    vi.mocked(sendFriendTalk).mockRejectedValue(new Error('fail'));
    expect((await request(app).post('/send').send({ userId: 'u1', message: 'hi' })).status).toBe(500);
  });
});
