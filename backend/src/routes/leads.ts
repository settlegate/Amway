import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';

const router = Router();

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'DONE', 'CONVERTED', 'LOST'] as const;

const patchSchema = z
  .object({
    status: z.enum(LEAD_STATUSES).optional(),
    notes: z.string().max(2000).optional(),
    followUpAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), 'followUpAt 형식이 올바르지 않습니다.')
      .optional(),
  })
  .strict();

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
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || '입력값이 올바르지 않습니다.' });
    return;
  }
  const { status, notes, followUpAt } = parsed.data;
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
  } catch (err: any) {
    console.error('리드 업데이트 오류:', err);
    if (err.code === 'P2025') {
      res.status(404).json({ error: '리드를 찾을 수 없습니다.' });
      return;
    }
    res.status(500).json({ error: '리드 업데이트 중 오류가 발생했습니다.' });
  }
});

export default router;
