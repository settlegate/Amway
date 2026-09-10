import { Router } from 'express';
import { analyzeBodyImage } from '../lib/ai';
import { prisma } from '../lib/db';

const router = Router();

router.post('/analyze', async (req, res) => {
  const { imageBase64, userId, mimeType = 'image/png' } = req.body;
  if (!imageBase64) {
    res.status(400).json({ error: 'imageBase64가 필요합니다.' });
    return;
  }

  try {
    const result = await analyzeBodyImage({ imageBase64, mimeType, userId });

    if (userId) {
      await prisma.bodyRecord.create({
        data: {
          userId,
          skeletalMuscleKg: Number(result.skeletalMuscleKg) || 0,
          bodyFatPercent: Number(result.bodyFatPercent) || 0,
          visceralFatLevel: Number(result.visceralFatLevel) || 0,
          bodyType: result.bodyType,
          imageUrl: '',
          recordedAt: new Date(),
        },
      });
    }

    res.json(result);
  } catch (err) {
    console.error('체성분 분석 오류:', err);
    res.status(500).json({ error: '체성분 분석 중 오류가 발생했습니다.' });
  }
});

router.get('/records/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const records = await prisma.bodyRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 20,
    });
    res.json(records);
  } catch (err) {
    console.error('체성분 기록 조회 오류:', err);
    res.status(500).json({ error: '기록 조회 중 오류가 발생했습니다.' });
  }
});

export default router;
