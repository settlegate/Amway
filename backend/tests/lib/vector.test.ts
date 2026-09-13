import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaMock } from '../helpers/prismaMock';

const h = vi.hoisted(() => ({
  client: null as any,
  createEmbedding: vi.fn(),
  query: vi.fn(),
  index: vi.fn(),
  pineconeOptions: [] as any[],
}));

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));
vi.mock('../../src/lib/openai', () => ({
  get openai() {
    return h.client;
  },
  createEmbedding: h.createEmbedding,
}));
vi.mock('@pinecone-database/pinecone', () => ({
  Pinecone: class {
    constructor(opts: any) {
      h.pineconeOptions.push(opts);
    }
    index(name: string) {
      h.index(name);
      return { query: h.query };
    }
  },
}));

const BRAND_URL = 'https://www.amway.co.kr/shop/brand-shop/nutrition-brand/nutrilite/c/nutrilite';

const omega = {
  id: 'omega',
  code: 'OMEGA3',
  name: '뉴트리 마린 오메가-3',
  category: '식물영양소',
  description: 'EPA·DHA가 풍부해요',
  benefits: '혈행 개선, 기억력 개선',
  dosage: '식후 2정',
  price: 53000,
  salesVolume: 10,
  imageUrl: 'https://img/omega.jpg',
  aClicUrl: 'https://www.amway.co.kr/p/126138K',
};

const lutein = {
  id: 'lutein',
  code: 'LUTEIN',
  name: '루테인 플러스',
  category: '눈 건강',
  description: null,
  benefits: ';,',
  dosage: null,
  price: 40000,
  salesVolume: 99,
  imageUrl: null,
  aClicUrl: '#',
};

async function load({ pinecone = false, index }: { pinecone?: boolean; index?: string } = {}) {
  vi.resetModules();
  if (pinecone) vi.stubEnv('PINECONE_API_KEY', 'pc-key');
  if (index) vi.stubEnv('PINECONE_INDEX', index);
  const { prisma } = (await import('../../src/lib/db')) as unknown as { prisma: PrismaMock };
  const mod = await import('../../src/lib/vector');
  return { prisma, ...mod };
}

beforeEach(() => {
  h.client = null;
});

describe('searchProducts (DB 검색)', () => {
  it('구매 가능한 활성 제품 중 키워드 점수가 높은 순으로 반환한다', async () => {
    const { prisma, searchProducts } = await load();
    prisma.product.findMany.mockResolvedValue([lutein, omega]);

    const result = await searchProducts('혈행에 좋은 오메가3 추천해주세요');

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { isActive: true, isPurchasable: true },
      orderBy: { salesVolume: 'desc' },
      take: 50,
    });
    // '오메가'는 눈 동의어 그룹에도 속해 루테인 제품이 낮은 점수로 함께 매칭된다
    expect(result.map((p) => p.id)).toEqual(['omega', 'lutein']);
    expect(result[0]).toMatchObject({
      benefits: ['혈행 개선', '기억력 개선'],
      price: 53000,
      purchaseUrl: omega.aClicUrl,
    });
  });

  it('동의어를 확장해 검색하고 누락된 값은 기본값으로 정규화한다', async () => {
    const { prisma, searchProducts } = await load();
    prisma.product.findMany.mockResolvedValue([omega, lutein]);

    const result = await searchProducts('눈이 침침해요');

    expect(result[0]).toMatchObject({
      id: 'lutein',
      benefits: undefined,
      imageUrl: 'https://placehold.co/120x120/e5e7eb/1f2937?text=Amway',
      purchaseUrl: BRAND_URL,
    });
  });

  it('점수가 같으면 판매량이 많은 제품을 먼저 반환한다', async () => {
    const { prisma, searchProducts } = await load();
    prisma.product.findMany.mockResolvedValue([
      { ...omega, id: 'a', salesVolume: 1 },
      { ...omega, id: 'b', salesVolume: 5 },
      { ...omega, id: 'c', salesVolume: null },
    ]);

    const result = await searchProducts('오메가');

    expect(result.map((p) => p.id)).toEqual(['b', 'a', 'c']);
    expect(result[2].salesVolume).toBe(0);
  });

  it('가격이 없거나 크롤링 오류가 있는 제품은 제외한다', async () => {
    const { prisma, searchProducts } = await load();
    prisma.product.findMany.mockResolvedValue([
      { ...omega, id: 'free', price: 0 },
      { ...omega, id: 'url', name: 'https://broken' },
      { ...omega, id: 'warn', description: 'Warning: blocked' },
      { ...omega, id: 'captcha', description: 'CAPTCHA required' },
      { ...omega, id: 'ok', name: null, category: null },
    ]);

    const result = await searchProducts('혈행');

    expect(result.map((p) => p.id)).toEqual(['ok']);
  });

  it('불용어·조사만 있는 질문은 관련 제품이 없다고 판단한다', async () => {
    const { prisma, searchProducts } = await load();
    prisma.product.findMany.mockResolvedValue([omega]);

    const result = await searchProducts('것은 까지 추천 ? 요');

    expect(result).toEqual([]);
    expect(console.log).toHaveBeenCalledWith('[vector] No relevant products found');
  });

  it('DB 조회 오류가 나면 빈 배열을 반환한다', async () => {
    const { prisma, searchProducts } = await load();
    prisma.product.findMany.mockRejectedValue(new Error('db down'));

    await expect(searchProducts('피로')).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith('[vector] DB 검색 오류:', expect.any(Error));
  });
});

describe('searchProducts (Pinecone 검색)', () => {
  const match = (id: string, metadata: Record<string, any> = {}) => ({
    id,
    metadata: { name: id, category: 'c', price: '1000', ...metadata },
  });

  it('임베딩으로 벡터 검색하고 3개 이상이면 그대로 반환한다', async () => {
    h.client = {};
    h.createEmbedding.mockResolvedValue([0.1, 0.2]);
    h.query.mockResolvedValue({
      matches: [match('m1', { code: 'C1', benefits: ['a', 'b'] }), match('m2'), match('m3', { price: 'abc' })],
    });
    const { prisma, searchProducts } = await load({ pinecone: true, index: 'custom-index' });

    const result = await searchProducts('피로');

    expect(h.pineconeOptions.at(-1)).toEqual({ apiKey: 'pc-key' });
    expect(h.index).toHaveBeenCalledWith('custom-index');
    expect(h.query).toHaveBeenCalledWith({ vector: [0.1, 0.2], topK: 5, includeMetadata: true });
    expect(result.map((p) => p.code)).toEqual(['C1', 'm2', 'm3']);
    expect(result[0].benefits).toEqual(['a', 'b']);
    expect(result[2].price).toBe(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it('결과가 3개 미만이면 DB 검색 결과를 중복 없이 합친다', async () => {
    h.query.mockResolvedValue({ matches: [match('omega')] });
    const { prisma, searchProducts } = await load({ pinecone: true });
    prisma.product.findMany.mockResolvedValue([omega, { ...omega, id: 'omega-2' }]);

    const result = await searchProducts('오메가');

    expect(h.index).toHaveBeenCalledWith('amway-products');
    expect(h.createEmbedding).not.toHaveBeenCalled();
    expect(h.query).toHaveBeenCalledWith(expect.objectContaining({ vector: [] }));
    expect(result.map((p) => p.id)).toEqual(['omega', 'omega-2']);
  });

  it('matches가 없으면 DB 검색 결과만 반환한다', async () => {
    h.query.mockResolvedValue({});
    const { prisma, searchProducts } = await load({ pinecone: true });
    prisma.product.findMany.mockResolvedValue([omega]);

    const result = await searchProducts('오메가');

    expect(result.map((p) => p.id)).toEqual(['omega']);
  });

  it('Pinecone 오류가 나면 DB 검색으로 대체한다', async () => {
    h.query.mockRejectedValue(new Error('pinecone down'));
    const { prisma, searchProducts } = await load({ pinecone: true });
    prisma.product.findMany.mockResolvedValue([omega]);

    const result = await searchProducts('오메가');

    expect(console.error).toHaveBeenCalledWith('[vector] Pinecone 검색 오류:', expect.any(Error));
    expect(result.map((p) => p.id)).toEqual(['omega']);
  });
});
