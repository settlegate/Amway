import { Router } from 'express';
import { handleKakaoWebhook, sendFriendTalk } from '../lib/kakao';

const router = Router();

router.post('/webhook', (req, res, next) => {
  const secret = process.env.KAKAO_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: '웹훅이 설정되지 않았습니다.' });
      return;
    }
  } else if (req.get('x-kakao-secret') !== secret) {
    res.status(403).json({ error: '웹훅 인증에 실패했습니다.' });
    return;
  }
  next();
}, async (req, res) => {
  try {
    const result = await handleKakaoWebhook(req.body);
    res.json(result);
  } catch (err) {
    console.error('카카오 웹훅 처리 오류:', err);
    res.status(500).json({ error: '웹훅 처리 중 오류가 발생했습니다.' });
  }
});

router.post('/send', async (req, res) => {
  const { userId, message, templateCode } = req.body;
  if (!userId || !message) {
    res.status(400).json({ error: 'userId, message가 필요합니다.' });
    return;
  }
  try {
    const result = await sendFriendTalk(userId, message, templateCode);
    res.json(result);
  } catch (err) {
    console.error('카카오 메시지 발송 오류:', err);
    res.status(500).json({ error: '메시지 발송 중 오류가 발생했습니다.' });
  }
});

export default router;
