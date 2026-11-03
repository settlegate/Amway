import { Router } from 'express';
import { prisma } from '../lib/db';
import { requireUser } from '../lib/auth';

const router = Router();

router.use(requireUser);

router.get('/', async (req, res) => {
  const userId = (req as any).userId as string;
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
  const userId = (req as any).userId as string;
  const { productId, productName, dosage, intakeTime, cycleDays } = req.body;
  if (!productName || !intakeTime) {
    res.status(400).json({ error: 'productName, intakeTime이 필요합니다.' });
    return;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(intakeTime)) {
    res.status(400).json({ error: 'intakeTime은 HH:MM 형식이어야 합니다.' });
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
