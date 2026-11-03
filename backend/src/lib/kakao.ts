import { generateHealthReply } from './ai';
import { isAmwayUrl } from './amwayProduct';
import { prisma } from './db';

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

  const consentReply = await handleConsentKeyword(userId, message);
  if (consentReply) {
    return {
      version: '2.0',
      template: { outputs: [{ simpleText: { text: consentReply } }] },
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
            webLinkUrl: p.purchaseUrl || (isAmwayUrl(p.aClicUrl || '') ? p.aClicUrl : null) || 'https://www.amway.co.kr',
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

const OPT_OUT_RE = /수신\s*거부|광고\s*거부|구독\s*취소/;
const OPT_IN_RE = /^수신\s*동의$/;

async function setKakaoConsent(kakaoId: string | undefined, isAgreed: boolean) {
  if (!kakaoId) return false;
  const user = await prisma.user.findFirst({ where: { kakaoId } });
  if (!user) return false;
  await prisma.$transaction([
    prisma.consent.upsert({
      where: { userId_channel: { userId: user.id, channel: 'KAKAO' } },
      update: isAgreed
        ? { isAgreed: true, agreedAt: new Date(), revokedAt: null }
        : { isAgreed: false, revokedAt: new Date() },
      create: isAgreed
        ? { userId: user.id, channel: 'KAKAO', isAgreed: true, agreedAt: new Date() }
        : { userId: user.id, channel: 'KAKAO', isAgreed: false },
    }),
    prisma.user.update({ where: { id: user.id }, data: { isAgreed } }),
  ]);
  return true;
}

async function handleConsentKeyword(kakaoId: string | undefined, message: string) {
  const optOut = OPT_OUT_RE.test(message);
  const optIn = OPT_IN_RE.test(message.trim());
  if (!optOut && !optIn) return null;

  const updated = await setKakaoConsent(kakaoId, !optOut && optIn);
  if (optOut) {
    return updated
      ? '광고성 메시지 수신이 거부되었습니다. 다시 받으시려면 "수신동의"를 입력해 주세요.'
      : '수신거부 요청을 확인하지 못했습니다. 정주희 ABO에게 문의해 주세요.';
  }
  return updated
    ? '광고성 메시지 수신에 동의해 주셔서 감사합니다. 뉴스레터와 혜택 소식을 보내드릴게요.'
    : '수신동의 처리를 확인하지 못했습니다. 정주희 ABO에게 문의해 주세요.';
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
