import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

router.post('/agree', async (req, res) => {
  const { userId, channel = 'KAKAO' } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId가 필요합니다.' });
    return;
  }
  try {
    const ops = [
      prisma.consent.upsert({
        where: { userId_channel: { userId, channel } },
        update: { isAgreed: true, agreedAt: new Date(), revokedAt: null },
        create: {
          userId,
          channel,
          isAgreed: true,
          agreedAt: new Date(),
        },
      }),
    ];
    if (channel === 'KAKAO') {
      ops.push(prisma.user.update({ where: { id: userId }, data: { isAgreed: true } }) as any);
    }
    const [consent] = await prisma.$transaction(ops);
    res.json({ ok: true, consent });
  } catch (err) {
    console.error('동의 처리 오류:', err);
    res.status(500).json({ error: '동의 처리 중 오류가 발생했습니다.' });
  }
});

router.post('/withdraw', async (req, res) => {
  const { userId, channel = 'KAKAO' } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId가 필요합니다.' });
    return;
  }
  try {
    const ops = [
      prisma.consent.upsert({
        where: { userId_channel: { userId, channel } },
        update: { isAgreed: false, revokedAt: new Date() },
        create: {
          userId,
          channel,
          isAgreed: false,
        },
      }),
    ];
    if (channel === 'KAKAO') {
      ops.push(prisma.user.update({ where: { id: userId }, data: { isAgreed: false } }) as any);
    }
    const [consent] = await prisma.$transaction(ops);
    res.json({ ok: true, consent });
  } catch (err) {
    console.error('수신거부 처리 오류:', err);
    res.status(500).json({ error: '수신거부 처리 중 오류가 발생했습니다.' });
  }
});

export default router;
