import { Router } from 'express';
import { prisma } from '../lib/db';
import { encrypt } from '../lib/crypto';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const seminars = await prisma.seminar.findMany({
      orderBy: { date: 'asc' },
    });
    res.json(seminars);
  } catch (err) {
    console.error('세미나 조회 오류:', err);
    res.status(500).json({ error: '세미나 조회 중 오류가 발생했습니다.' });
  }
});

router.post('/:id/apply', async (req, res) => {
  const { id } = req.params;
  const { userId, name, phone } = req.body;
  if (!name || !phone) {
    res.status(400).json({ error: 'name, phone이 필요합니다.' });
    return;
  }
  try {
    const application = await prisma.seminarApplication.create({
      data: {
        userId: userId || null,
        seminarId: id,
        name: encrypt(name),
        phone: encrypt(phone),
        status: 'PENDING',
      },
    });
    res.json({ ...application, name, phone });
  } catch (err) {
    console.error('세미나 신청 오류:', err);
    res.status(500).json({ error: '세미나 신청 중 오류가 발생했습니다.' });
  }
});

export default router;
