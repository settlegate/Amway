import { generateHealthReply } from './ai';

const KAKAO_API_BASE = process.env.KAKAO_API_BASE || 'https://kapi.kakao.com';
const KAKAO_CHANNEL_TOKEN = process.env.KAKAO_CHANNEL_TOKEN;
const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

export async function handleKakaoWebhook(payload: any) {
  const userId = payload?.userRequest?.user?.id;
  const message = payload?.userRequest?.utterance || '';

  if (!message) {
    return {
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '안녕하세요. 암웨이 웰니스 AI 컨설턴트입니다.' } }],
      },
    };
  }

  const reply = await generateHealthReply({ message, userId });

  const outputs: any[] = [{ simpleText: { text: reply.text } }];
  for (const p of reply.products || []) {
    const benefits = Array.isArray(p.benefits) ? p.benefits.join(', ') : p.benefits;
    outputs.push({
      basicCard: {
        title: p.name,
        description: p.description || benefits || '',
        thumbnail: { imageUrl: p.imageUrl || 'https://via.placeholder.com/300' },
        buttons: [
          {
            label: 'a-clic 바로 구매',
            action: 'webLink',
            webLinkUrl: p.purchaseUrl || p.aClicUrl || 'https://www.amway.co.kr',
          },
        ],
      },
    });
  }

  return {
    version: '2.0',
    template: { outputs },
  };
}

export async function sendFriendTalk(userId: string, message: string, _templateCode?: string) {
  if (!KAKAO_CHANNEL_TOKEN || !KAKAO_API_KEY) {
    console.log('[kakao] 카카오 토큰/키 없음: mock 발송', { userId, message });
    return { ok: true, mock: true };
  }

  try {
    // 카카오 비즈메시지 API 예시
    const response = await fetch(`${KAKAO_API_BASE}/v2/api/talk/memo/default/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KAKAO_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        receiver_uuids: JSON.stringify([userId]),
        template_id: _templateCode || '',
      }),
    });
    return { ok: response.ok, status: response.status };
  } catch (err) {
    console.error('카카오 메시지 발송 오류:', err);
    return { ok: false, error: err };
  }
}
