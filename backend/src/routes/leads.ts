import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(leads);
  } catch (err) {
    console.error('리드 조회 오류:', err);
    res.status(500).json({ error: '리드 조회 중 오류가 발생했습니다.' });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, notes, followUpAt } = req.body;
  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        status,
        notes,
        followUpAt: followUpAt ? new Date(followUpAt) : undefined,
      },
    });
    res.json(lead);
  } catch (err) {
    console.error('리드 업데이트 오류:', err);
    res.status(500).json({ error: '리드 업데이트 중 오류가 발생했습니다.' });
  }
});

export default router;
