import { Router } from 'express';
import { searchProducts } from '../lib/vector';
import { prisma } from '../lib/db';

const router = Router();

router.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  try {
    const products = await searchProducts(q);
    res.json(products);
  } catch (err) {
    console.error('제품 검색 오류:', err);
    res.status(500).json({ error: '제품 검색 중 오류가 발생했습니다.' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { promotions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!product) {
      res.status(404).json({ error: '제품을 찾을 수 없습니다.' });
      return;
    }
    res.json(product);
  } catch (err) {
    console.error('제품 조회 오류:', err);
    res.status(500).json({ error: '제품 조회 중 오류가 발생했습니다.' });
  }
});

export default router;
