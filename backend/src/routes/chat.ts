import { Router } from 'express';
import { analyzeBodyImage, generateHealthReply } from '../lib/ai';

const router = Router();

router.post('/', async (req, res) => {
  const { message, userId, history, imageBase64, mimeType, bodyMetrics } = req.body;

  let payloadMessage = typeof message === 'string' ? message.trim() : '';
  let metrics = bodyMetrics;

  if (imageBase64 && typeof imageBase64 === 'string') {
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
