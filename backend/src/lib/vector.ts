import { Pinecone } from '@pinecone-database/pinecone';
import { openai, createEmbedding } from './openai';
import { prisma } from './db';
import type { Product } from './types';

const pineconeKey = process.env.PINECONE_API_KEY;
const pineconeIndex = process.env.PINECONE_INDEX || 'amway-products';

let pinecone: Pinecone | null = null;
if (pineconeKey) {
  pinecone = new Pinecone({ apiKey: pineconeKey });
}

const NUTRILITE_BRAND_URL =
  'https://www.amway.co.kr/shop/brand-shop/nutrition-brand/nutrilite/c/nutrilite';

function purchaseUrlOrFallback(row: any) {
  if (row.aClicUrl && row.aClicUrl !== '#') return row.aClicUrl;
  return NUTRILITE_BRAND_URL;
}

function splitBenefits(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

function normalizeProduct(row: any): Product {
  const p: Product = {
    ...row,
    benefits: Array.isArray(row.benefits) ? row.benefits : splitBenefits(row.benefits),
    price: Number(row.price ?? 0) || 0,
    salesVolume: Number(row.salesVolume ?? 0) || 0,
    imageUrl: row.imageUrl || 'https://placehold.co/120x120/e5e7eb/1f2937?text=Amway',
    purchaseUrl: purchaseUrlOrFallback(row),
  };
  return p;
}

function buildMockProducts(): Product[] {
  const raw = [
    {
      id: 'p1',
      code: 'DOUBLEX',
      name: '더블엑스 (124정X3팩, 31일분)',
      category: '비타민/미네랄',
      description: '56가지 식물농축물과 19종 비타민·미네랄이 골고루 담긴 종합영양제예요.',
      benefits: '면역 기능, 활성산소 저항, 에너지 대사',
      dosage: '식후 1포',
      price: 91000,
      salesVolume: 5200,
      imageUrl: 'https://media.amway.co.kr/sys-master/images/h9f/h4b/9386258694174/NU_120843K_1_640_R.jpg',
      aClicUrl: 'https://www.amway.co.kr/shop/nutrition/basic/vitamins-minerals/p/120843K',
    },
    {
      id: 'p2',
      code: 'BODYKEY',
      name: '바디키 식사대용 쉐이크 그레인 (14포)',
      category: '체중/체성분',
      description: '식사 대용으로 간편하게 즐기는 쉐이크예요.',
      benefits: '체지방 감소, 근육량 유지, 식후 혈당 상승 억제',
      dosage: '식전 1포',
      price: 55000,
      salesVolume: 4100,
      imageUrl: 'https://media.amway.co.kr/sys-master/images/h51/h10/9477858787358/NU_315512_1_640_R.jpg',
      aClicUrl: 'https://www.amway.co.kr/shop/nutrition/bodykey/p/315512',
    },
    {
      id: 'p3',
      code: 'OMEGA3',
      name: '뉴트리 마린 오메가-3 (120캡슐, 30일분)',
      category: '식물영양소',
      description: 'EPA·DHA가 풍부한 오메가-3로 일상 건강 관리에 좋아요.',
      benefits: '혈중 중성지방 개선, 혈행 개선, 기억력 개선',
      dosage: '식후 2정',
      price: 53000,
      salesVolume: 3500,
      imageUrl: 'https://media.amway.co.kr/sys-master/images/h9c/hae/9363112362014/NU_126138K_1_640_R.jpg',
      aClicUrl: 'https://www.amway.co.kr/shop/nutrition/functional/p/126138K',
    },
    {
      id: 'p4',
      code: 'PROTEIN',
      name: '뉴트리 파이토 푸로틴 (900g)',
      category: '단백질',
      description: '식물성 단백질을 담아 근육량과 포만감을 함께 챙겨요.',
      benefits: '근육량 증가, 식이섬유 보충, 포만감',
      dosage: '운동 후 1스푼',
      price: 85000,
      salesVolume: 2800,
      imageUrl: 'https://media.amway.co.kr/sys-master/images/hc2/h58/9410955804702/NU_122594K_1_640_R.jpg',
      aClicUrl: 'https://www.amway.co.kr/shop/nutrition/basic/proteins/p/122594K',
    },
    {
      id: 'p5',
      code: 'VITAMINC',
      name: '올데이 비타민 C 플러스 (60정, 60일분)',
      category: '비타민/미네랄',
      description: '비타민C로 하루 한 번 편하게 챙기세요.',
      benefits: '면역 기능, 피로 개선, 항산화',
      dosage: '식후 1정',
      price: 45000,
      salesVolume: 2200,
      imageUrl: 'https://media.amway.co.kr/sys-master/images/h90/he2/9473915879454/NU_109745K_1_640_R.jpg',
      aClicUrl: 'https://www.amway.co.kr/shop/nutrition/basic/vitamins-minerals/p/109745K',
    },
  ];
  return raw.map(normalizeProduct).sort((a, b) => (b.salesVolume || 0) - (a.salesVolume || 0));
}

const MOCK_PRODUCTS = buildMockProducts();

const SYNONYMS: Record<string, string[]> = {
  '간': ['간', '해독', '간염', '간기능', '밀크씨슬', '실리마린'],
  '피로': ['피로', '피곤', '활력', '에너지', '비타민B', '마그네슘', '철분', '홍삼', '인삼', '코엔자임'],
  '체중': ['체중', '다이어트', '체지방', '비만', '바디키', '식이섬유', '단백질', '감량', '감소'],
  '체지방': ['체지방', '체중', '다이어트', '식이섬유', '단백질', '감량', '감소'],
  '단백질': ['단백질', '근육', '근력', '아미노산'],
  '혈액': ['혈행', '혈액', '혈관', '중성지방', '오메가', '오메가3', 'dha', 'epa'],
  '눈': ['눈', '시력', '오메가', '오메가3', '루테인', '지아잔틴', '글루타치온', '아스타잔틴', '비타민A'],
  '장': ['장', '유산균', '프로바이오틱스', '배변', '식이섬유'],
  '뼈': ['뼈', '관절', '칼슘', '마그네슘', '비타민D'],
  '면역': ['면역', '감기', '항체', '비타민C', '아연', '유산균', '프로바이오틱스'],
  '수면': ['수면', '불면', '마그네슘', '감태'],
  '스트레스': ['스트레스', '비타민B', '마그네슘'],
  '기억': ['기억', '기억력', '두뇌', '오메가', '오메가3', 'dha', '인지질', '포스파티딜세린'],
  '심장': ['심장', '심혈관', '코엔자임', '오메가', '오메가3'],
  '피부': ['피부', '콜라겐', '히알루론산', '글루타치온', '아스타잔틴', '비타민C', '비타민E'],
  '감량': ['감량', '감소', '체중', '체지방', '다이어트'],
};

const STOPWORDS = new Set([
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '뿐', '에서', '에게', '으로', '로',
  '와', '과', '하', '하고', '해주세요', '추천', '좋아요', '도움', '개선', '느낌', '게', '지',
  '요', '것', '수', '많은', '위해', '때문에', '때문', '위해', '위한', '건강', '제품', '영양',
  '식품', '음식', '필요', '좋은', '어떤', '뭐', '뭘', '어떻게', '어떠', '저요', '같아요',
  '있나요', '있을까요', '해줘', '주세요', '관리', '하려고', '하고', '하면',
]);

const HEALTH_TERMS = new Set<string>([
  '간', '피로', '체중', '다이어트', '체지방', '단백질', '근육', '혈액', '혈행', '혈관',
  '중성지방', '오메가', '오메가3', '눈', '시력', '뼈', '관절', '칼슘', '마그네슘', '면역', '감기',
  '수면', '스트레스', '기억', '기억력', '두뇌', '심장', '피부', '콜라겐', '에너지', '활력',
  '항산화', '유산균', '프로바이오틱스', '배변', '식이섬유', '미네랄', '비타민', '비타민A', '비타민B',
  '비타민C', '비타민D', '비타민E', '루테인', '지아잔틴', '글루타치온', '아스타잔틴', '철분', '아연',
  '홍삼', '인삼', '코엔자임', '감태', '인지질', '포스파티딜세린', '히알루론산', '밀크씨슬', '실리마린',
  'dha', 'epa', '단백', '장', '위', '코',
  '간염', '해독', '간기능', '감량', '감소', '조절',
]);

function stripCommonPostposition(token: string): string {
  return token.replace(
    /(은|는|이|가|을|를|에|도|만|뿐|에서|에게|으로|와|과|한테|께|부터|까지|한테|께|으로)$/,
    ''
  );
}

function extractKeywords(query: string): string[] {
  const raw = query.toLowerCase();
  const tokens = raw
    .replace(/[.,!?·:;"'()\-/\\[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const keywords = new Set<string>();

  for (const token of tokens) {
    if (STOPWORDS.has(token)) continue;

    // 1) health_terms에 있는 접두 키워드인 경우
    let matchedTerm: string | null = null;
    for (const term of HEALTH_TERMS) {
      if (token.startsWith(term) && term.length > (matchedTerm?.length ?? 0)) {
        matchedTerm = term;
      }
    }

    if (matchedTerm) {
      keywords.add(matchedTerm);
      continue;
    }

    // 2) 접미 조사를 떼고 health_terms에 있는지 확인
    const stripped = stripCommonPostposition(token);
    if (stripped && stripped !== token) {
      if (STOPWORDS.has(stripped)) continue;
      for (const term of HEALTH_TERMS) {
        if (stripped.startsWith(term) && term.length > (matchedTerm?.length ?? 0)) {
          matchedTerm = term;
        }
      }
      if (matchedTerm) {
        keywords.add(matchedTerm);
        continue;
      }
    }

    // 3) 그 외 2글자 이상 단어 보존
    if (token.length >= 2) {
      keywords.add(token);
    }
  }

  // 동의어 확장
  const expanded = new Set<string>(keywords);
  for (const keyword of [...keywords]) {
    for (const [key, values] of Object.entries(SYNONYMS)) {
      if (keyword.includes(key) || values.some((v) => keyword.includes(v))) {
        expanded.add(key);
        values.forEach((v) => expanded.add(v));
      }
    }
  }

  return [...expanded];
}

function scoreProduct(row: any, keywords: string[]): number {
  const fields: [string, number][] = [
    [row.name || '', 8],
    [row.category || '', 6],
    [row.benefits || '', 5],
    [row.description || '', 4],
    [row.dosage || '', 2],
  ];

  let score = 0;
  for (const [text, weight] of fields) {
    const lower = String(text).toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) score += weight;
    }
  }
  return score;
}

async function searchDbProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  const keywords = extractKeywords(q);

  const rawRows = await prisma.product.findMany({
    where: { isActive: true, isPurchasable: true },
    orderBy: { salesVolume: 'desc' },
    take: 50,
  });

  const allRows = rawRows.filter((row) =>
    row.price > 0 &&
    !row.name?.startsWith('http') &&
    !row.description?.includes('Warning') &&
    !row.description?.includes('CAPTCHA')
  );

    const scored = allRows.map((row) => ({
    row,
    score: scoreProduct(row, keywords),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.row.salesVolume || 0) - (a.row.salesVolume || 0);
  });

  const matched = scored.filter((s) => s.score >= 3);

  const selected = matched.slice(0, 3).map((s) => s.row);
  return selected.map(normalizeProduct);
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (pinecone) {
    const index = pinecone.index(pineconeIndex);
    try {
      let vector: number[] = [];
      if (openai) {
        vector = await createEmbedding(query);
      }

      const result = await index.query({
        vector,
        topK: 5,
        includeMetadata: true,
      });

      const products =
        result.matches?.map((m) => {
          const p = m.metadata as any;
          return normalizeProduct({
            id: m.id,
            code: p.code || m.id,
            name: p.name,
            category: p.category,
            description: p.description,
            benefits: p.benefits,
            dosage: p.dosage,
            price: p.price,
            salesVolume: p.salesVolume,
            imageUrl: p.imageUrl,
            aClicUrl: p.aClicUrl,
          });
        }) ?? [];

      if (products.length >= 3) return products;

      const dbProducts = await searchDbProducts(query);
      const existingIds = new Set(products.map((p) => p.id));
      const merged = [
        ...products,
        ...dbProducts.filter((p) => !existingIds.has(p.id)),
      ];
      return merged.slice(0, Math.max(3, merged.length));
    } catch (err) {
      console.error('[vector] Pinecone 검색 오류:', err);
    }
  }

  try {
    const dbProducts = await searchDbProducts(query);
    if (dbProducts.length > 0) {
      return dbProducts.slice(0, Math.max(3, dbProducts.length));
    }
  } catch (err) {
    console.error('[vector] DB 검색 오류:', err);
  }

  console.log('[vector] No relevant products found');
  return [];
}
