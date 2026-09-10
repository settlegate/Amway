import { Router } from 'express';
import { prisma } from '../lib/db';
import { uploadPromo } from '../lib/upload';

const router = Router();

const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 'on';

const buildImageUrl = (req: any, filename: string) => {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:3001';
  return `${protocol}://${host}/uploads/${filename}`;
};

router.get('/', async (_req, res) => {
  try {
    const items = await prisma.homePromotion.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(items);
  } catch (err) {
    console.error('홈 프로모션 목록 오류:', err);
    res.status(500).json({ error: '홈 프로모션 목록 조회 중 오류가 발생했습니다.' });
  }
});

router.post('/', uploadPromo.single('image'), async (req: any, res) => {
  const { targetUrl, alt } = req.body;
  const imageUrl = req.file ? buildImageUrl(req, req.file.filename) : (req.body.imageUrl || '');

  if (!imageUrl) {
    res.status(400).json({ error: '프로모션 이미지가 필요합니다.' });
    return;
  }
  if (!targetUrl) {
    res.status(400).json({ error: '프로모션 링크 URL이 필요합니다.' });
    return;
  }

  try {
    const promo = await prisma.homePromotion.create({
      data: {
        imageUrl,
        targetUrl,
        alt: alt || null,
        isActive: toBool(req.body.isActive),
      },
    });
    res.json(promo);
  } catch (err) {
    console.error('홈 프로모션 생성 오류:', err);
    res.status(500).json({ error: '홈 프로모션 생성 중 오류가 발생했습니다.' });
  }
});

router.put('/:id', async (req: any, res) => {
  const { id } = req.params;
  const { targetUrl, alt, imageUrl } = req.body;

  const updateData: any = {};
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (targetUrl !== undefined) updateData.targetUrl = targetUrl;
  if (alt !== undefined) updateData.alt = alt || null;
  if (req.body.isActive !== undefined) updateData.isActive = toBool(req.body.isActive);

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: '수정할 내용이 없습니다.' });
    return;
  }

  try {
    const promo = await prisma.homePromotion.update({
      where: { id },
      data: updateData,
    });
    res.json(promo);
  } catch (err: any) {
    console.error('홈 프로모션 수정 오류:', err);
    if (err.code === 'P2025') {
      res.status(404).json({ error: '홈 프로모션을 찾을 수 없습니다.' });
      return;
    }
    res.status(500).json({ error: '홈 프로모션 수정 중 오류가 발생했습니다.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.homePromotion.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('홈 프로모션 삭제 오류:', err);
    if (err.code === 'P2025') {
      res.status(404).json({ error: '홈 프로모션을 찾을 수 없습니다.' });
      return;
    }
    res.status(500).json({ error: '홈 프로모션 삭제 중 오류가 발생했습니다.' });
  }
});

export default router;
