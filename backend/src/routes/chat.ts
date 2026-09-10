import { Router } from 'express';
import { generateHealthReply } from '../lib/ai';

const router = Router();

router.post('/', async (req, res) => {
  const { message, userId } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message가 필요합니다.' });
    return;
  }

  try {
    const reply = await generateHealthReply({ message, userId });
    res.json(reply);
  } catch (err) {
    console.error('채팅 응답 생성 오류:', err);
    res.status(500).json({ error: '응답 생성 중 오류가 발생했습니다.' });
  }
});

export default router;
