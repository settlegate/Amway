import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { encrypt } from '../lib/crypto';

const router = Router();

const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

const applySchema = z.object({
  userId: z.string().max(100).optional(),
  name: z.string().trim().min(1, 'name이 필요합니다.').max(50),
  phone: z.string().regex(PHONE_RE, '전화번호 형식이 올바르지 않습니다.'),
});

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
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || '입력값이 올바르지 않습니다.' });
    return;
  }
  const { userId, name, phone } = parsed.data;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const seminar = await tx.seminar.findUnique({ where: { id } });
      if (!seminar) return { code: 'NOT_FOUND' as const };
      if (seminar.maxAttendees) {
        const taken = await tx.seminarApplication.count({
          where: { seminarId: id, status: { not: 'CANCELLED' } },
        });
        if (taken >= seminar.maxAttendees) return { code: 'FULL' as const };
      }
      if (userId) {
        const duplicate = await tx.seminarApplication.findFirst({
          where: { seminarId: id, userId, status: { not: 'CANCELLED' } },
        });
        if (duplicate) return { code: 'DUPLICATE' as const };
      }
      const application = await tx.seminarApplication.create({
        data: {
          userId: userId || null,
          seminarId: id,
          name: encrypt(name),
          phone: encrypt(phone),
          status: 'PENDING',
        },
      });
      return { code: 'OK' as const, application };
    });

    if (result.code === 'NOT_FOUND') {
      res.status(404).json({ error: '세미나를 찾을 수 없습니다.' });
      return;
    }
    if (result.code === 'FULL') {
      res.status(409).json({ error: '정원이 마감되었습니다.' });
      return;
    }
    if (result.code === 'DUPLICATE') {
      res.status(409).json({ error: '이미 신청한 세미나입니다.' });
      return;
    }
    res.json({ ...result.application, name, phone });
  } catch (err) {
    console.error('세미나 신청 오류:', err);
    res.status(500).json({ error: '세미나 신청 중 오류가 발생했습니다.' });
  }
});

export default router;
