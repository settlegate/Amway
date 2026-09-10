import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const promo = await prisma.homePromotion.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(promo || null);
  } catch (err) {
    console.error('홈 프로모션 조회 오류:', err);
    res.status(500).json({ error: '홈 프로모션 조회 중 오류가 발생했습니다.' });
  }
});

export default router;
