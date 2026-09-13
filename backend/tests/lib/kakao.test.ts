import { describe, expect, it, vi } from 'vitest';
import { generateHealthReply } from '../../src/lib/ai';

vi.mock('../../src/lib/ai', () => ({ generateHealthReply: vi.fn() }));

const reply = vi.mocked(generateHealthReply);

async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('../../src/lib/kakao');
}

describe('handleKakaoWebhook', () => {
  it.each([undefined, {}, { userRequest: { utterance: '' } }])('발화가 없으면 인사 메시지를 반환한다 (%o)', async (payload) => {
    const { handleKakaoWebhook } = await load();

    const result = await handleKakaoWebhook(payload);

    expect(result.template.outputs).toEqual([
      { simpleText: { text: '안녕하세요. 암웨이 웰니스 AI 컨설턴트입니다.' } },
    ]);
    expect(reply).not.toHaveBeenCalled();
  });

  it('AI 답변과 추천 제품 카드를 카카오 스킬 응답으로 변환한다', async () => {
    reply.mockResolvedValue({
      text: '답변',
      source: 'openai',
      products: [
        { id: '1', name: 'A', description: '설명', imageUrl: 'a.jpg', purchaseUrl: 'https://buy/a', aClicUrl: 'https://aclic/a' },
        { id: '2', name: 'B', benefits: ['면역', '피로'], aClicUrl: 'https://aclic/b' },
        { id: '3', name: 'C', benefits: '눈 건강' },
        { id: '4', name: 'D' },
      ],
    } as any);
    const { handleKakaoWebhook } = await load();

    const result = await handleKakaoWebhook({ userRequest: { user: { id: 'kakao-1' }, utterance: '피곤해요' } });

    expect(reply).toHaveBeenCalledWith({ message: '피곤해요', userId: 'kakao-1' });
    const [text, a, b, c, d] = result.template.outputs;
    expect(text).toEqual({ simpleText: { text: '답변' } });
    expect(a.basicCard).toMatchObject({
      title: 'A',
      description: '설명',
      thumbnail: { imageUrl: 'a.jpg' },
      buttons: [{ label: 'a-clic 바로 구매', action: 'webLink', webLinkUrl: 'https://buy/a' }],
    });
    expect(b.basicCard.description).toBe('면역, 피로');
    expect(b.basicCard.buttons[0].webLinkUrl).toBe('https://aclic/b');
    expect(b.basicCard.thumbnail.imageUrl).toBe('https://via.placeholder.com/300');
    expect(c.basicCard.description).toBe('눈 건강');
    expect(d.basicCard.description).toBe('');
    expect(d.basicCard.buttons[0].webLinkUrl).toBe('https://www.amway.co.kr');
    expect(result.version).toBe('2.0');
  });

  it('추천 제품이 없으면 텍스트만 반환한다', async () => {
    reply.mockResolvedValue({ text: '답변', source: 'mock' } as any);
    const { handleKakaoWebhook } = await load();

    const result = await handleKakaoWebhook({ userRequest: { utterance: '안녕' } });

    expect(result.template.outputs).toHaveLength(1);
  });
});

describe('sendFriendTalk', () => {
  it('토큰이 없으면 mock 발송 결과를 반환한다', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { sendFriendTalk } = await load({ KAKAO_API_KEY: 'key' });

    await expect(sendFriendTalk('u1', 'hi')).resolves.toEqual({ ok: true, mock: true });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('비즈메시지 API로 발송한다', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetch);
    const { sendFriendTalk } = await load({ KAKAO_CHANNEL_TOKEN: 'token', KAKAO_API_KEY: 'key' });

    await expect(sendFriendTalk('u1', 'hi', 'tpl')).resolves.toEqual({ ok: true, status: 200 });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://kapi.kakao.com/v2/api/talk/memo/default/send');
    expect(init.headers.Authorization).toBe('Bearer key');
    expect(init.body.get('receiver_uuids')).toBe('["u1"]');
    expect(init.body.get('template_id')).toBe('tpl');
  });

  it('API 주소 환경 변수를 사용하고 템플릿이 없으면 빈 값을 보낸다', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal('fetch', fetch);
    const { sendFriendTalk } = await load({
      KAKAO_CHANNEL_TOKEN: 'token',
      KAKAO_API_KEY: 'key',
      KAKAO_API_BASE: 'https://kakao.test',
    });

    await expect(sendFriendTalk('u1', 'hi')).resolves.toEqual({ ok: false, status: 401 });
    expect(fetch.mock.calls[0][0]).toBe('https://kakao.test/v2/api/talk/memo/default/send');
    expect(fetch.mock.calls[0][1].body.get('template_id')).toBe('');
  });

  it('네트워크 오류는 실패 결과로 반환한다', async () => {
    const error = new Error('network');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    const { sendFriendTalk } = await load({ KAKAO_CHANNEL_TOKEN: 'token', KAKAO_API_KEY: 'key' });

    await expect(sendFriendTalk('u1', 'hi')).resolves.toEqual({ ok: false, error });
  });
});
