import { Router } from 'express';
import { prisma } from '../lib/db';
import { syncProductFromUrl, syncAllProducts } from '../lib/amwayProduct';

const router = Router();

router.get('/dashboard', async (_req, res) => {
  try {
    const [userCount, leadCount, seminarCount, bodyRecordCount] = await Promise.all([
      prisma.user.count(),
      prisma.lead.count(),
      prisma.seminar.count(),
      prisma.bodyRecord.count(),
    ]);

    const followUpLeads = await prisma.lead.findMany({
      where: { status: 'FOLLOW_UP' },
      orderBy: { followUpAt: 'asc' },
      take: 20,
      include: { user: true },
    });

    res.json({
      counts: { userCount, leadCount, seminarCount, bodyRecordCount },
      followUpLeads,
    });
  } catch (err) {
    console.error('대시보드 조회 오류:', err);
    res.status(500).json({ error: '대시보드 조회 중 오류가 발생했습니다.' });
  }
});

// ----------------------
// 제품 동기화
// ----------------------
router.get('/products', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ isActive: 'desc' }, { salesVolume: 'desc' }, { name: 'asc' }],
      include: { promotions: { where: { isActive: true } } },
    });
    res.json(products);
  } catch (err) {
    console.error('관리자 제품 목록 오류:', err);
    res.status(500).json({ error: '제품 목록 조회 중 오류가 발생했습니다.' });
  }
});

router.post('/products/sync', async (req, res) => {
  const { url, code, category } = req.body;
  if (!url) {
    res.status(400).json({ error: 'url이 필요합니다.' });
    return;
  }
  try {
    const result = await syncProductFromUrl(url, { code, category });
    res.json(result);
  } catch (err: any) {
    console.error('제품 동기화 오류:', err);
    res.status(500).json({ error: err.message || '제품 동기화 중 오류가 발생했습니다.' });
  }
});

router.post('/products/sync-all', async (_req, res) => {
  try {
    const results = await syncAllProducts();
    res.json({ synced: results.length, results });
  } catch (err: any) {
    console.error('전체 제품 동기화 오류:', err);
    res.status(500).json({ error: err.message || '전체 제품 동기화 중 오류가 발생했습니다.' });
  }
});

// ----------------------
// 프로모션 / 일정 관리
// ----------------------
router.get('/promotions', async (_req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      include: { product: { select: { id: true, code: true, name: true } } },
      orderBy: [{ isActive: 'desc' }, { endAt: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(promotions);
  } catch (err) {
    console.error('프로모션 조회 오류:', err);
    res.status(500).json({ error: '프로모션 조회 중 오류가 발생했습니다.' });
  }
});

router.post('/promotions', async (req, res) => {
  const { title, description, productId, startAt, endAt, isActive } = req.body;
  if (!title) {
    res.status(400).json({ error: 'title이 필요합니다.' });
    return;
  }
  try {
    const promotion = await prisma.promotion.create({
      data: {
        title,
        description: description || null,
        productId: productId || null,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: { product: { select: { id: true, code: true, name: true } } },
    });
    res.json(promotion);
  } catch (err) {
    console.error('프로모션 생성 오류:', err);
    res.status(500).json({ error: '프로모션 생성 중 오류가 발생했습니다.' });
  }
});

router.put('/promotions/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, productId, startAt, endAt, isActive } = req.body;
  try {
    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        title,
        description: description !== undefined ? description : undefined,
        productId: productId !== undefined ? productId || null : undefined,
        startAt: startAt !== undefined ? (startAt ? new Date(startAt) : null) : undefined,
        endAt: endAt !== undefined ? (endAt ? new Date(endAt) : null) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: { product: { select: { id: true, code: true, name: true } } },
    });
    res.json(promotion);
  } catch (err: any) {
    console.error('프로모션 수정 오류:', err);
    if (err.code === 'P2025') {
      res.status(404).json({ error: '프로모션을 찾을 수 없습니다.' });
      return;
    }
    res.status(500).json({ error: '프로모션 수정 중 오류가 발생했습니다.' });
  }
});

router.delete('/promotions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.promotion.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('프로모션 삭제 오류:', err);
    if (err.code === 'P2025') {
      res.status(404).json({ error: '프로모션을 찾을 수 없습니다.' });
      return;
    }
    res.status(500).json({ error: '프로모션 삭제 중 오류가 발생했습니다.' });
  }
});

export default router;
