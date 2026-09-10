import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

router.get('/', async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId가 필요합니다.' });
    return;
  }
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reminders);
  } catch (err) {
    console.error('복용 리마인더 조회 오류:', err);
    res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
  }
});

router.post('/', async (req, res) => {
  const { userId, productId, productName, dosage, intakeTime, cycleDays } = req.body;
  if (!userId || !productName || !intakeTime) {
    res.status(400).json({ error: 'userId, productName, intakeTime가 필요합니다.' });
    return;
  }
  try {
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        productId: productId || null,
        productName,
        dosage,
        intakeTime,
        cycleDays: Number(cycleDays) || 30,
      },
    });
    res.json(reminder);
  } catch (err) {
    console.error('복용 리마인더 생성 오류:', err);
    res.status(500).json({ error: '리마인더 생성 중 오류가 발생했습니다.' });
  }
});

export default router;
