import { Router } from 'express';
import { prisma } from '../lib/db';
import { kstDay } from '../lib/analytics';
import { optionalUser } from '../lib/auth';

const router = Router();

const VISITOR_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const CONTENT_TYPES = new Set([
  'product',
  'promotion',
  'recommend',
  'highlight',
  'seminar',
  'banner',
]);

const asShortString = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

router.post('/track', optionalUser, async (req, res) => {
  const body = req.body ?? {};
  const { visitorId, path, type } = body;

  if (typeof visitorId !== 'string' || !VISITOR_ID_RE.test(visitorId)) {
    res.status(400).json({ error: 'visitorId가 올바르지 않습니다.' });
    return;
  }
  if (typeof path !== 'string' || !path.startsWith('/') || path.length > 200) {
    res.status(400).json({ error: 'path가 올바르지 않습니다.' });
    return;
  }

  const kind = type === 'content' ? 'content' : 'pageview';
  const contentType = asShortString(body.contentType, 30);
  const contentId = asShortString(body.contentId, 100);
  const contentName = asShortString(body.contentName, 100);

  if (kind === 'content' && (!contentType || !CONTENT_TYPES.has(contentType) || !contentId)) {
    res.status(400).json({ error: '콘텐츠 정보가 올바르지 않습니다.' });
    return;
  }

  try {
    await prisma.pageView.create({
      data: {
        visitorId,
        userId: (req as any).userId ?? null,
        type: kind,
        day: kstDay(),
        path,
        contentType: kind === 'content' ? contentType : null,
        contentId: kind === 'content' ? contentId : null,
        contentName: kind === 'content' ? contentName : null,
      },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('방문자 추적 저장 오류:', err);
    res.status(500).json({ error: '저장 중 오류가 발생했습니다.' });
  }
});

export default router;
