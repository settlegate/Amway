import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncAllProducts, syncProductFromUrl } from '../../src/lib/amwayProduct';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';

vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));

const prisma = prismaImport as unknown as PrismaMock;

const AMWAY_URL = 'https://www.amway.co.kr/shop/nutrition/p/120843K';
const IMAGE = 'https://media.amway.co.kr/sys-master/images/h9f/h4b/9386258694174/NU_120843K_1_640_R.jpg';

const PAGE = [
  'Title: 뉴트리라이트 더블엑스 | 한국암웨이',
  '',
  'Markdown Content:',
  '# 뉴트리라이트 더블엑스',
  'VPS : 8843 SKU : 120843K',
  '* ',
  '‹›',
  '91,000원',
  'PV : 45,500',
  'BV : 60,000',
  `![img](${IMAGE})`,
  '장바구니 바로구매',
].join('\n');

const DETAIL_PAGE = [
  'Title: 뉴트리 오메가 제품 상세정보',
  '# 뉴트리 오메가',
  '혈행 건강을 위한 오메가-3',
  '[링크](http://x)',
  '- 목록 항목',
  '품절',
  '## 상세',
].join('\n');

function mockFetch(handler: (url: string) => { ok?: boolean; body?: string } | Error) {
  const fn = vi.fn(async (url: string) => {
    const r = handler(url);
    if (r instanceof Error) throw r;
    return { ok: r.ok ?? true, text: async () => r.body ?? '' };
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const saved = (data: Record<string, any>) => ({ id: 'saved', isPurchasable: true, ...data });

beforeEach(() => {
  prisma.product.create.mockImplementation(async ({ data }: any) => saved(data));
  prisma.product.update.mockImplementation(async ({ data }: any) => saved(data));
});

describe('syncProductFromUrl', () => {
  it('http로 시작하지 않는 URL은 거부한다', async () => {
    await expect(syncProductFromUrl('ftp://amway')).rejects.toThrow('http/https');
  });

  it('신규 상품이면 페이지 정보를 파싱해 생성한다', async () => {
    const fetch = mockFetch(() => ({ body: PAGE }));

    const result = await syncProductFromUrl(AMWAY_URL);

    expect(fetch).toHaveBeenCalledWith(`https://r.jina.ai/${AMWAY_URL}`, expect.objectContaining({ signal: expect.anything() }));
    expect(prisma.product.findFirst).toHaveBeenCalledWith({ where: { aClicUrl: { contains: '120843K' } } });
    expect(prisma.product.findUnique).not.toHaveBeenCalled();
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        code: '120843K',
        name: '뉴트리라이트 더블엑스',
        category: '기타',
        description: '뉴트리라이트 더블엑스',
        price: 91000,
        pv: 45500,
        bv: 60000,
        promotion: null,
        imageUrl: IMAGE,
        aClicUrl: AMWAY_URL,
        isPurchasable: true,
        lastSyncedAt: expect.any(Date),
      }),
    });
    expect(prisma.promotion.findFirst).not.toHaveBeenCalled();
    expect(result).toEqual({
      productId: 'saved',
      name: '뉴트리라이트 더블엑스',
      price: 91000,
      pv: 45500,
      bv: 60000,
      imageUrl: IMAGE,
      promotion: null,
      isNew: true,
      isPurchasable: true,
    });
  });

  it('SKU로 기존 상품을 찾으면 수동 설명을 유지한 채 업데이트한다', async () => {
    mockFetch(() => ({ body: PAGE }));
    prisma.product.findFirst.mockResolvedValue({ id: 'p1', price: 1, pv: 1, bv: 1, promotion: null, imageUrl: null });

    const result = await syncProductFromUrl(AMWAY_URL, { code: 'DOUBLEX' });

    expect(prisma.product.findUnique).not.toHaveBeenCalled();
    const { where, data } = prisma.product.update.mock.calls[0][0];
    expect(where).toEqual({ id: 'p1' });
    expect(data).not.toHaveProperty('description');
    expect(data).toMatchObject({ price: 91000, pv: 45500, bv: 60000, imageUrl: IMAGE });
    expect(result.isNew).toBe(false);
  });

  it('상품 코드로 기존 상품을 찾고 파싱되지 않은 값은 기존 값을 유지한다', async () => {
    const fetch = mockFetch(() => ({ body: DETAIL_PAGE }));
    prisma.product.findUnique.mockResolvedValue({
      id: 'p1', price: 50000, pv: 10, bv: 20, promotion: '기존 프로모션', imageUrl: 'old.jpg',
    });
    prisma.product.update.mockImplementation(async ({ data }: any) => ({ id: 'p1', ...data, isPurchasable: undefined }));

    const result = await syncProductFromUrl('https://example.com/product/omega', { code: 'OMEGA' });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(prisma.product.findFirst).not.toHaveBeenCalled();
    expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { code: 'OMEGA' } });
    expect(prisma.product.update.mock.calls[0][0].data).toMatchObject({
      name: '뉴트리 오메가',
      description: '혈행 건강을 위한 오메가-3 품절',
      price: 50000,
      pv: 10,
      bv: 20,
      promotion: '기존 프로모션',
      imageUrl: 'old.jpg',
      isPurchasable: false,
    });
    // DB 결과에 isPurchasable이 없으면 true로 간주
    expect(result).toMatchObject({ productId: 'p1', isNew: false, isPurchasable: true });
  });

  it('SKU와 코드가 모두 없으면 제목 기반 코드로 생성한다', async () => {
    mockFetch(() => ({ body: DETAIL_PAGE }));

    await syncProductFromUrl('https://example.com/product/omega', { category: '오메가' });

    expect(prisma.product.create.mock.calls[0][0].data).toMatchObject({
      code: 'sku-뉴트리 오메가',
      category: '오메가',
      price: 0,
      imageUrl: null,
    });
  });

  it('SKU 라인이 없으면 문서 처음부터 파싱하고 구매 불가 여부를 판단한다', async () => {
    mockFetch(() => ({ body: 'Title: 테스트 상품\n가격 12,345원\n구매 불가' }));

    const result = await syncProductFromUrl('https://example.com/p/999');

    expect(prisma.product.create.mock.calls[0][0].data).toMatchObject({
      code: '999',
      price: 12345,
      description: '테스트 상품',
      isPurchasable: false,
    });
    expect(result.imageUrl).toBeNull();
  });

  it('SKU가 여러 번 나오면 가격 정보가 뒤따르는 위치를 사용한다', async () => {
    const filler = Array.from({ length: 16 }, (_, i) => `요약 ${i}`);
    mockFetch(() => ({ body: ['Title: 요약 상품', 'SKU : 111', ...filler, 'SKU : 111', '10,000원'].join('\n') }));

    await syncProductFromUrl('https://example.com/item');

    expect(prisma.product.findFirst).toHaveBeenCalledWith({ where: { aClicUrl: { contains: '111' } } });
    expect(prisma.product.create.mock.calls[0][0].data.price).toBe(10000);
  });

  it('가격 정보가 없는 SKU만 있으면 첫 번째 위치를 사용한다', async () => {
    mockFetch(() => ({ body: 'Title: 가격 없음\nSKU : 222\n설명' }));

    await syncProductFromUrl('https://example.com/item');

    expect(prisma.product.create.mock.calls[0][0].data).toMatchObject({ code: '222', price: 0 });
  });

  it('긴 설명은 400자로 자른다', async () => {
    mockFetch(() => ({ body: `Title: 긴 설명\n# 긴 설명\n${'가'.repeat(450)}` }));

    await syncProductFromUrl('https://example.com/item');

    const { description } = prisma.product.create.mock.calls[0][0].data;
    expect(description).toHaveLength(403);
    expect(description.endsWith('...')).toBe(true);
  });

  it.each([
    'https://media.amway.co.kr/sys-master/images/a/NU_444_640_R.jpg',
    'https://media.amway.co.kr/sys-master/images/a/NU_444_2.jpg',
    'https://media.amway.co.kr/sys-master/images/a/other_444_x.jpg',
  ])('이미지 URL 패턴 %s 를 추출한다', async (image) => {
    mockFetch(() => ({ body: `Title: 이미지\nSKU : 444\n1,000원\n![](${image})` }));

    const result = await syncProductFromUrl('https://example.com/p/444');

    expect(result.imageUrl).toBe(image);
  });

  it('프로모션 페이지면 종료일과 함께 프로모션을 생성한다', async () => {
    mockFetch(() => ({
      body: 'Title: 글루타치온 프로모션\n# 글루타치온 프로모션\nSKU : 333\n20,000원\n프로모션 종료일 : 2026년 9월 30일',
    }));

    const result = await syncProductFromUrl('https://example.com/p/333');

    expect(result.promotion).toBe('글루타치온 프로모션');
    expect(prisma.promotion.findFirst).toHaveBeenCalledWith({
      where: { productId: 'saved', title: '글루타치온 프로모션' },
    });
    expect(prisma.promotion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: 'saved',
        title: '글루타치온 프로모션',
        endAt: new Date(2026, 8, 30, 23, 59, 59),
        isActive: true,
      }),
    });
  });

  it('이미 등록된 프로모션은 다시 생성하지 않는다', async () => {
    mockFetch(() => ({ body: 'Title: Summer Promotion\nSKU : 555\n1,000원' }));
    prisma.promotion.findFirst.mockResolvedValue({ id: 'promo' });

    await syncProductFromUrl('https://example.com/p/555');

    expect(prisma.promotion.create).not.toHaveBeenCalled();
  });

  it('www 페이지를 가져오지 못하면 api 도메인으로 재시도한다', async () => {
    const fetch = mockFetch((url) =>
      url.includes('www.amway.co.kr') ? new Error('blocked') : { body: PAGE },
    );

    await syncProductFromUrl(AMWAY_URL);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][0]).toBe('https://r.jina.ai/https://api.amway.co.kr/shop/nutrition/p/120843K');
    expect(console.warn).toHaveBeenCalled();
  });

  it('페이지를 가져오지 못하면 오류를 던진다', async () => {
    mockFetch(() => ({ ok: false }));
    await expect(syncProductFromUrl('https://example.com/p/1')).rejects.toThrow('가져오지 못했습니다');
  });

  it('제목을 파싱하지 못하면 오류를 던진다', async () => {
    mockFetch(() => ({ body: '제목 없는 페이지' }));
    await expect(syncProductFromUrl('https://example.com/p/1')).rejects.toThrow('파싱에 실패');
  });
});

describe('syncAllProducts', () => {
  it('URL이 있는 제품을 순서대로 동기화하고 실패한 제품은 건너뛴다', async () => {
    prisma.product.findMany.mockResolvedValue([
      { name: 'ok', code: 'OK', aClicUrl: 'https://example.com/p/1' },
      { name: 'fail', code: 'FAIL', aClicUrl: 'https://example.com/p/2' },
    ]);
    prisma.product.findUnique.mockResolvedValue({ id: 'p', price: 0 });
    mockFetch((url) => (url.endsWith('/p/1') ? { body: 'Title: 성공\nSKU : 1\n1,000원' } : { body: '' }));

    const results = await syncAllProducts();

    expect(prisma.product.findMany).toHaveBeenCalledWith({ where: { aClicUrl: { not: null } } });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('성공');
    expect(console.error).toHaveBeenCalledWith('[syncAll] fail 동기화 실패:', expect.any(Error));
  });
});
