import { Router } from 'express';
import { analyzeBodyImage, generateHealthReply } from '../lib/ai';
import { optionalUser } from '../lib/auth';

const router = Router();

const MAX_MESSAGE_LEN = 2000;
const MAX_IMAGE_BASE64_LEN = 8_000_000; // base64 문자열 약 8MB (바이너리 ~6MB)
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

router.post('/', optionalUser, async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  const { message, history, imageBase64, mimeType, bodyMetrics } = req.body;

  let payloadMessage = typeof message === 'string' ? message.trim() : '';
  let metrics = bodyMetrics;

  if (payloadMessage.length > MAX_MESSAGE_LEN) {
    res.status(400).json({ error: '메시지는 2,000자 이내로 입력해 주세요.' });
    return;
  }

  if (imageBase64 && typeof imageBase64 === 'string') {
    if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
      res.status(400).json({ error: '지원하지 않는 이미지 형식입니다. (PNG·JPEG·WebP만 가능)' });
      return;
    }
    if (imageBase64.length > MAX_IMAGE_BASE64_LEN) {
      res.status(400).json({ error: '이미지 크기가 너무 큽니다.' });
      return;
    }
    const analysis = await analyzeBodyImage({ imageBase64, mimeType: mimeType || 'image/png' });
    metrics = {
      skeletalMuscleKg: analysis.skeletalMuscleKg,
      bodyFatPercent: analysis.bodyFatPercent,
      visceralFatLevel: analysis.visceralFatLevel,
      bodyType: analysis.bodyType,
      confidence: analysis.confidence,
      valid: analysis.valid,
    };
    if (!payloadMessage) payloadMessage = '인바디 결과지를 분석하고 맞는 상품을 추천해줘';
  }

  if (!payloadMessage) {
    res.status(400).json({ error: 'message가 필요합니다.' });
    return;
  }

  try {
    const reply = await generateHealthReply({ message: payloadMessage, userId, history, bodyMetrics: metrics });
    res.json({ ...reply, bodyResult: metrics });
  } catch (err) {
    console.error('채팅 응답 생성 오류:', err);
    res.status(500).json({ error: '응답 생성 중 오류가 발생했습니다.' });
  }
});

export default router;
