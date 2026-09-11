import { prisma } from './db';

export interface SyncProductResult {
  productId: string;
  name: string;
  price: number;
  pv: number | null;
  bv: number | null;
  imageUrl: string | null;
  promotion: string | null;
  isNew: boolean;
  isPurchasable: boolean;
}

function skuFromUrl(url: string): string {
  const match = url.match(/\/p\/([A-Za-z0-9]+)/);
  return match ? match[1] : '';
}

async function fetchPageText(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  try {
    const res = await fetch(jinaUrl, { signal: AbortSignal.timeout(15000) });
    if (res.ok) return res.text();
  } catch (err) {
    console.warn('[amwayProduct] fetch 실패:', jinaUrl, err);
  }
  return '';
}

async function fetchAmwayText(url: string): Promise<string> {
  let text = await fetchPageText(url);
  if (!text && url.includes('https://www.amway.co.kr')) {
    const apiUrl = url.replace('https://www.amway.co.kr', 'https://api.amway.co.kr');
    text = await fetchPageText(apiUrl);
  }
  return text;
}

function parseNumbers(str: string | undefined | null): number | null {
  if (!str) return null;
  const clean = str.replace(/[^\d]/g, '');
  return clean ? Number(clean) : null;
}

function parseIsPurchasable(text: string): boolean {
  const unavailable = /(구매\s*불가|구매\s*불가능|구매\s*불가능한\s*상품|현재\s*구매하실\s*수\s*없는\s*상품|품\s*절|일시\s*품\s*절|재\s*고\s*없음|매진|판매\s*종료)/i;
  return !unavailable.test(text);
}

function extractImageUrl(text: string, sku: string): string | null {
  if (!sku) return null;
  const patterns = [
    `https://media\\.amway\\.co\\.kr/sys-master/images/[^\\s"\\]]*NU_${sku}_1_640_R\\.jpg`,
    `https://media\\.amway\\.co\\.kr/sys-master/images/[^\\s"\\]]*NU_${sku}_640_R\\.jpg`,
    `https://media\\.amway\\.co\\.kr/sys-master/images/[^\\s"\\]]*NU_${sku}_\\d+\\.jpg`,
    `https://media\\.amway\\.co\\.kr/sys-master/images/[^\\s"\\]]*${sku}[^\\s"\\]]*\\.jpg`,
  ];
  for (const pattern of patterns) {
    const match = text.match(new RegExp(pattern, 'i'));
    if (match) return match[0];
  }
  return null;
}

function parsePromotionEnd(text: string): Date | null {
  const match = text.match(/프로모션\s*종료일\s*[:=]\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (match) {
    const [_, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
  }
  return null;
}

function findProductBlock(text: string, title: string, sku: string): string {
  const lines = text.split(/\n/).map((l) => l.trim());

  // SKU 라인(예: "VPS : 8843 SKU : 120843K")을 상품 본문 시작점으로 사용
  // 같은 SKU가 요약/상세 두 곳에 나올 수 있으므로, 뒤에 가격/PV가 오는 라인을 선택
  let start = -1;
  if (sku) {
    const skuRe = new RegExp(`SKU\\s*[:=]\\s*${sku}\\b`, 'i');
    const candidates = lines
      .map((l, i) => (skuRe.test(l) ? i : -1))
      .filter((i) => i >= 0);
    start =
      candidates.find((i) =>
        /[\d,]{3,}\s*원|PV\s*[:=]/.test(lines.slice(i, i + 15).join(' '))
      ) ?? candidates[0];
  }
  if (start === -1) {
    start = lines.findIndex(
      (l) => l.startsWith('# ') && title && l.includes(title)
    );
  }
  if (start === -1 || start === undefined) start = 0;

  const end = lines.findIndex(
    (l, i) =>
      i > start &&
      (/^#{1,2}\s/.test(l) ||
        /장바구니 바로구매|카카오톡 제품 공유|다른 분들은/.test(l))
  );
  return lines
    .slice(start, end === -1 ? start + 30 : end)
    .filter((l) => l !== '‹›' && !/^(?:\*|\-)\s*$/.test(l))
    .join('\n');
}

function parseAmwayProductPage(text: string, url: string) {
  const titleMatch = text.match(/^Title:\s*(.+?)(?:\s*\||\s*제품\s*상세정보|\s*$)/im);
  const title = titleMatch
    ? titleMatch[1].replace(/\s+/g, ' ').trim()
    : '';

  const isPromotion = /프로모션|promotion/i.test(title);
  const sku = skuFromUrl(url) || text.match(/SKU\s*[:=]\s*([A-Za-z0-9]+)/i)?.[1] || '';

  const blockText = findProductBlock(text, title, sku);

  const priceMatch = blockText.match(/(?:^|\s)([\d,]{3,})\s*원/);
  const pvMatch = blockText.match(/PV\s*[:=]\s*([\d,]+)/i);
  const bvMatch = blockText.match(/BV\s*[:=]\s*([\d,]+)/i);

  const imageUrl = extractImageUrl(text, sku);

  const price = priceMatch ? parseNumbers(priceMatch[1]) : null;
  const pv = parseNumbers(pvMatch?.[1]);
  const bv = parseNumbers(bvMatch?.[1]);

  let description = '';
  const blockLines = blockText.split('\n').filter((l) => l);
  const metaEnd = blockLines.findIndex(
    (l) =>
      /^(?:VPS|SKU|PV|BV)/i.test(l) ||
      /^[\d,]+\s*원$/i.test(l) ||
      /^(?:가격|원산지|배달|장바구니|구매|확인|닫기)/.test(l)
  );

  for (let i = 0; i < (metaEnd === -1 ? blockLines.length : metaEnd); i++) {
    const l = blockLines[i];
    if (
      !/^#/.test(l) &&
      !l.includes(title) &&
      !/^[*\-!]\s/.test(l) &&
      !/\[.*\]\(.*\)/.test(l)
    ) {
      description += ` ${l}`;
    }
  }
  description = description.replace(/\s+/g, ' ').trim();
  if (!description) description = title;
  if (description.length > 400) description = `${description.slice(0, 400)}...`;

  const promotionEnd = isPromotion ? parsePromotionEnd(text) : null;
  const isPurchasable = parseIsPurchasable(blockText);

  return {
    title,
    description,
    sku,
    price,
    pv,
    bv,
    imageUrl,
    isPromotion,
    promotionEnd,
    isPurchasable,
  };
}

export async function syncProductFromUrl(
  url: string,
  options: { code?: string; category?: string } = {}
): Promise<SyncProductResult> {
  if (!url.startsWith('http')) {
    throw new Error('URL은 http/https로 시작해야 합니다.');
  }

  const text = await fetchAmwayText(url);
  if (!text) {
    throw new Error('암웨이 상품 페이지를 가져오지 못했습니다.');
  }

  const parsed = parseAmwayProductPage(text, url);
  if (!parsed.title) {
    throw new Error('상품 정보 파싱에 실패했습니다.');
  }

  let product = null;
  if (parsed.sku) {
    product = await prisma.product.findFirst({
      where: { aClicUrl: { contains: parsed.sku } },
    });
  }
  if (!product && options.code) {
    product = await prisma.product.findUnique({ where: { code: options.code } });
  }

  const isNew = !product;

  if (!product) {
    product = await prisma.product.create({
      data: {
        code: options.code || parsed.sku || `sku-${parsed.title.slice(0, 20)}`,
        name: parsed.title,
        category: options.category || '기타',
        description: parsed.description,
        price: parsed.price || 0,
        pv: parsed.pv,
        bv: parsed.bv,
        promotion: parsed.isPromotion ? parsed.title : null,
        imageUrl: parsed.imageUrl,
        aClicUrl: url,
        isPurchasable: parsed.isPurchasable,
        lastSyncedAt: new Date(),
      },
    });
  } else {
    product = await prisma.product.update({
      where: { id: product.id },
      data: {
        name: parsed.title,
        // 페이지에서 추출한 실질 설명이 있을 때만 덮어씀 (기존 수동 설명 유지)
        ...(parsed.description && parsed.description !== parsed.title
          ? { description: parsed.description }
          : {}),
        price: parsed.price ?? product.price,
        pv: parsed.pv ?? product.pv,
        bv: parsed.bv ?? product.bv,
        promotion: parsed.isPromotion ? parsed.title : product.promotion,
        imageUrl: parsed.imageUrl || product.imageUrl,
        aClicUrl: url,
        isPurchasable: parsed.isPurchasable,
        lastSyncedAt: new Date(),
      },
    });
  }

  if (parsed.isPromotion && product) {
    const existing = await prisma.promotion.findFirst({
      where: { productId: product.id, title: parsed.title },
    });
    if (!existing) {
      await prisma.promotion.create({
        data: {
          productId: product.id,
          title: parsed.title,
          description: parsed.description,
          endAt: parsed.promotionEnd,
          isActive: true,
        },
      });
    }
  }

  return {
    productId: product.id,
    name: product.name,
    price: product.price,
    pv: product.pv,
    bv: product.bv,
    imageUrl: product.imageUrl,
    promotion: product.promotion,
    isNew,
    isPurchasable: product.isPurchasable ?? true,
  };
}

export async function syncAllProducts(): Promise<SyncProductResult[]> {
  const products = await prisma.product.findMany({
    where: { aClicUrl: { not: null } },
  });

  const results: SyncProductResult[] = [];
  for (const p of products) {
    try {
      const r = await syncProductFromUrl(p.aClicUrl!, { code: p.code });
      results.push(r);
    } catch (err) {
      console.error(`[syncAll] ${p.name} 동기화 실패:`, err);
    }
  }
  return results;
}
