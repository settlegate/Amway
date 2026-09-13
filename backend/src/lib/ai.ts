import { z } from 'zod';
import { openai, CHAT_MODEL } from './openai';
import { searchProducts } from './vector';
import { isSafeText, GUARD_MESSAGE } from './guard';
import { enrichWithNutrientInfo } from './nutrients';

type Turn = { role: 'user' | 'ai'; text: string };

const SYSTEM_INSTRUCTION =
  '당신은 40~50대 한국 여성을 대상으로 따뜻하고 전문적인 암웨이 웰니스 컨설턴트입니다. ' +
  '한국암웨이 공식 라벨 정보와 식약처 승인 기능성 문구만 인용하세요. ' +
  '질병 진단·치료·예방, 확정 수입, 과장된 효능을 약속하는 표현은 사용하지 마세요. ' +
  '사용자의 말에 먼저 공감하고, 질문에 직접 답변하세요. ' +
  '제품 추천은 사용자가 원하거나, 건강 고민(잠, 피로, 눈, 피부 등)을 언급하면 관련 영양소와 제품의 작용 메커니즘을 자연스럽게 설명하세요. ' +
  '관련 제품이 없으면 일반적인 영양·생활 조언을 주세요. ' +
  '추가 질문은 질문이 모호할 때만 최대 1개 하고, 구체적인 질문에는 추가 질문 없이 답변하세요. ' +
  '자연스러운 한국어 구어체(~요체)로, 4~8문장 내외로 충분히 설명하세요.';

function formatWon(price?: number) {
  if (typeof price !== 'number') return '';
  return `${price.toLocaleString('ko-KR')}원`;
}

const BodyAnalysisSchema = z.object({
  skeletalMuscleKg: z.coerce.number().min(10).max(100).optional(),
  bodyFatPercent: z.coerce.number().min(0).max(100).optional(),
  visceralFatLevel: z.coerce.number().min(0).max(30).optional(),
  bodyType: z.enum(['근육 부족형', '체지방 과다형', '균형형', '분석 실패']).optional(),
  summary: z.string().optional(),
  recommendation: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
});

type BodyMetrics = z.infer<typeof BodyAnalysisSchema>;

type ValidatedBody = BodyMetrics & { confidence?: 'high' | 'medium' | 'low'; valid: boolean };

function validateBodyMetrics(metrics: BodyMetrics): ValidatedBody {
  const { skeletalMuscleKg, bodyFatPercent, visceralFatLevel } = metrics;
  const values = [skeletalMuscleKg, bodyFatPercent, visceralFatLevel].filter((v) => v !== undefined);
  const tooLow = skeletalMuscleKg !== undefined && skeletalMuscleKg < 5;
  const tooHigh =
    (skeletalMuscleKg !== undefined && skeletalMuscleKg > 100) ||
    (bodyFatPercent !== undefined && bodyFatPercent > 60) ||
    (visceralFatLevel !== undefined && visceralFatLevel > 30);
  const valid = values.length > 0 && !tooLow && !tooHigh;
  return { ...metrics, valid };
}

function productContext(products: any[]) {
  if (!products.length) return '';
  return products
    .map(
      (p, i) =>
        `[${i + 1}] ${p.name} (${formatWon(p.price)})\n` +
        `- 간략 소개: ${p.description || '한국암웨이 공식 제품'}\n` +
        `- 주요 기능: ${Array.isArray(p.benefits) ? p.benefits.join(', ') : p.benefits || ''}\n` +
        `- 섭취법: ${p.dosage || '식사 후'}`
    )
    .join('\n\n');
}

function buildMockReply(message: string, products: any[]) {
  if (!products.length) {
    return '말씀하신 부분에 공감드려요. 규칙적인 식사와 충분한 수면, 가벼운 운동이 건강 관리의 기초예요. 더 구체적인 조언을 원하시면 어떤 부분이 가장 신경 쓰이시는지 알려주세요.';
  }
  const names = products.map((p) => `• ${p.name} (${formatWon(p.price)})`).join('\n');
  const text = `그 마음 충분히 이해해요.\n\n` +
    `한국암웨이 공식 라벨 정보를 바탕으로, 질문과 관련된 제품을 골라봤어요.\n\n` +
    `${names}\n\n` +
    `하단의 제품 카드에서 이미지와 간략 소개, 금액, 구매 링크를 확인해 보세요.`;
  return text;
}

function buildUserPrompt(message: string, products: any[], userId?: string, bodyMetrics?: BodyMetrics) {
  const userContext = userId ? `사용자 ID: ${userId}\n` : '';
  const bodyContext = buildBodyMetricsContext(bodyMetrics);
  const productSection = products.length
    ? `추천 가능한 제품 (사용자의 건강 고민과 직접 관련된 경우 언급):\n${productContext(products)}\n\n`
    : '추천 가능한 제품: 없습니다. 제품 언급은 하지 마세요.\n\n';
  return `${userContext}${bodyContext}사용자: ${message}\n\n` +
    `${productSection}` +
    `지침:\n` +
    `- 사용자 말에 먼저 공감하고 직접 답변하세요.\n` +
    `- 사용자가 제품을 요구하지 않아도, 건강 고민(잠, 피로, 눈, 피부 등)을 언급하면 관련 영양소와 제품의 작용 메커니즘을 1~2문장으로 설명하고 제품을 자연스럽게 추천하세요.\n` +
    `- 제공된 제품 중 사용자 질문과 직접 관련된 제품만 추천하고, 그 이유를 한 문장으로 설명하세요.\n` +
    `- 관련 제품이 없으면 제품 추천 없이 일반적인 영양·생활 조언을 주세요.\n` +
    `- 추가 질문은 질문이 모호할 때만 1개 하고, 구체적인 질문(예: "시력이 나빠져", "피로가 심해")에는 추가 질문 없이 답변하세요.\n` +
    `- 질병 진단·치료·예방, 확정 수입, 과장된 효능을 약속하는 표현은 사용하지 마세요.\n` +
    `- 암웨이 공식 라벨 정보와 식약처 승인 기능성 문구만 인용하세요.\n` +
    `- 자연스러운 한국어 구어체(~요체)로, 4~8문장 내외로 충분히 설명하세요.`;
}

const ABO_FOOTER = '\n\n더 나은 건강 상담과 제품 추천은 정주희 ABO에게 문의하세요^^';
const MEDICAL_DISCLAIMER = '\n\n(본 분석은 참고용이며, 정확한 건강 상태는 전문의와 상담하세요.)';

function withABOFooter(text: string) {
  if (text.includes('정주희 ABO에게 문의하세요')) return text;
  return text.trimEnd() + ABO_FOOTER;
}

const NUTRIENT_TERMS = [
  '오메가', '오메가3', '오메가-3', '루테인', '지아잔틴', '비타민A', '비타민B', '비타민C',
  '비타민D', '비타민E', '비타민', '미네랄', '칼슘', '마그네슘', '철분', '아연', '셀레늄',
  '홍삼', '인삼', '유산균', '프로바이오틱스', '식이섬유', '콜라겐', '히알루론산', '글루타치온',
  '아스타잔틴', '코엔자임', '큐텐', '감태', '인지질', '포스파티딜세린', '단백질', '아미노산',
  '밀크씨슬', '실리마린', 'dha', 'epa',
];

async function findRelatedProducts(answer: string, excludeIds: Set<string>): Promise<any[]> {
  const lower = answer.toLowerCase();
  const matchedTerms = NUTRIENT_TERMS.filter((term) => lower.includes(term.toLowerCase()));
  if (matchedTerms.length === 0) return [];

  const related: any[] = [];
  for (const term of matchedTerms) {
    const found = await searchProducts(term);
    for (const p of found) {
      if (!excludeIds.has(p.id) && !related.some((r) => r.id === p.id)) {
        related.push(p);
      }
    }
  }
  return related.slice(0, 6);
}

function buildBodyMetricsContext(metrics?: BodyMetrics) {
  if (!metrics) return '';
  const items: string[] = [];
  if (metrics.skeletalMuscleKg !== undefined) items.push(`skeletal muscle: ${metrics.skeletalMuscleKg}kg`);
  if (metrics.bodyFatPercent !== undefined) items.push(`body fat: ${metrics.bodyFatPercent}%`);
  if (metrics.visceralFatLevel !== undefined) items.push(`visceral fat: ${metrics.visceralFatLevel}`);
  if (metrics.bodyType) items.push(`body type: ${metrics.bodyType}`);
  return `User body composition:\n${items.join('\n')}\n\n`;
}

function bodyToKeywords(metrics: BodyMetrics): string[] {
  const keywords: string[] = [];
  if (metrics.skeletalMuscleKg !== undefined && metrics.skeletalMuscleKg < 20) keywords.push('단백질', '바디키');
  if (metrics.bodyFatPercent !== undefined && metrics.bodyFatPercent > 30) keywords.push('바디키', '체지방');
  if (metrics.visceralFatLevel !== undefined && metrics.visceralFatLevel > 8) keywords.push('오메가3', '코큐텐');
  if (metrics.bodyType?.includes('근육')) keywords.push('단백질');
  if (metrics.bodyType?.includes('체지방')) keywords.push('바디키');
  return keywords;
}

function enhanceSearchQuery(message: string): string {
  const lower = message.toLowerCase();
  const extra: string[] = [];
  if (/잠|수면|불면|숙면/.test(lower)) extra.push('수면 마그네슘');
  if (/눈|시력|눈물|눈피로/.test(lower)) extra.push('눈 루테인');
  if (/피로|피곤|활력|에너지|스트레스/.test(lower)) extra.push('피로 코큐텐 비타민B');
  if (/피부|주름|탄력|보습/.test(lower)) extra.push('피부 콜라겐 히알루론산');
  if (/장|소화|유산균|프로바이오틱스/.test(lower)) extra.push('장 유산균');
  if (/면역|감기/.test(lower)) extra.push('면역 홍삼 비타민C');
  if (/뼈|관절|칼슘/.test(lower)) extra.push('뼈 칼슘 비타민D');
  if (/체중|다이어트|식이섬유/.test(lower)) extra.push('체중 식이섬유');
  if (/혈행|중성지방|콜레스테롤/.test(lower)) extra.push('혈행 오메가3 EPA');
  if (/간|술|음주/.test(lower)) extra.push('간 밀크씨슬');
  if (/기억|집중|인지/.test(lower)) extra.push('기억 포스파티딜세린');
  if (extra.length === 0) return message;
  return `${message} ${extra.join(' ')}`;
}

export async function generateHealthReply({
  message,
  userId,
  history,
  bodyMetrics,
}: {
  message: string;
  userId?: string;
  history?: Turn[];
  bodyMetrics?: BodyMetrics;
}) {
  const guard = isSafeText(message);
  if (!guard.safe) return { text: GUARD_MESSAGE, products: [], source: 'guard' };

  const keywords = bodyMetrics ? bodyToKeywords(bodyMetrics) : [];
  const [messageProducts, ...bodyProducts] = await Promise.all([
    message.trim() ? searchProducts(enhanceSearchQuery(message)) : Promise.resolve([]),
    ...keywords.map((kw) => searchProducts(kw)),
  ]);
  const bodyProductsFlat = bodyProducts.flat();
  const merged = new Map<string, any>();
  for (const p of [...bodyProductsFlat, ...messageProducts]) merged.set(p.id, p);
  const selected = Array.from(merged.values()).slice(0, 3);

  if (!openai) {
    return { text: withABOFooter(buildMockReply(message, selected)), products: selected, source: 'mock' };
  }

  const conversation = (history || [])
    .slice(-10)
    .map((h) => ({
      role: h.role === 'ai' ? ('assistant' as const) : ('user' as const),
      content: h.text,
    }));

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...conversation,
        { role: 'user', content: buildUserPrompt(message, selected, userId, bodyMetrics) },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const text = completion.choices[0]?.message?.content || '답변을 생성하지 못했습니다.';
    const safe = isSafeText(text);
    if (!safe.safe) return { text: withABOFooter(GUARD_MESSAGE), products: selected, source: 'guard' };

    const selectedIds = new Set(selected.map((p) => p.id));
    const related = await findRelatedProducts(text, selectedIds);
    const finalProducts = [...selected, ...related].slice(0, 6);
    const enrichedText = await enrichWithNutrientInfo(text);
    const enrichedSafe = isSafeText(enrichedText);
    if (!enrichedSafe.safe) return { text: withABOFooter(GUARD_MESSAGE), products: finalProducts, source: 'guard' };
    const finalText = bodyMetrics ? `${enrichedText.trimEnd()}${MEDICAL_DISCLAIMER}` : enrichedText;
    return { text: withABOFooter(finalText), products: finalProducts, source: 'openai' };
  } catch (err) {
    console.error('OpenAI 응답 생성 오류:', err);
    return { text: withABOFooter(buildMockReply(message, selected)), products: selected, source: 'error' };
  }
}

export async function analyzeBodyImage({
  imageBase64,
  mimeType = 'image/png',
  userId,
}: {
  imageBase64: string;
  mimeType?: string;
  userId?: string;
}) {
  if (!openai) {
    console.log('[ai] OPENAI_API_KEY 없음: mock 체성분 분석 반환');
    return validateBodyMetrics({
      skeletalMuscleKg: 24.5,
      bodyFatPercent: 28.0,
      visceralFatLevel: 8,
      bodyType: '근육 부족형',
      summary: '현재 근육 부족형 체형입니다. 단백질 보충과 바디키 4주 프로그램을 추천합니다. (본 분석은 참고용이며, 정확한 건강 상태는 전문의와 상담하세요.)',
      recommendation: '뉴트리라이트 바디키 + 더블엑스',
      confidence: 'high',
    });
  }

  const BODY_ANALYSIS_PROMPT =
    'Extract the following fields from the Inbody/body composition result image and return only a JSON object.\n' +
    'Omit any field you cannot find.\n' +
    'Use the most recent measurement column if multiple columns are visible.\n' +
    'If a number is unreadable, set the field to null.\n' +
    'Write "summary" and "recommendation" in natural Korean (~yo form).\n' +
    'Include a medical disclaimer at the end of "summary".\n' +
    '\n' +
    'Schema:\n' +
    '{\n' +
    '  "skeletalMuscleKg": number, // 골격근량(kg)\n' +
    '  "bodyFatPercent": number,   // 체지방률(%)\n' +
    '  "visceralFatLevel": number, // 내장지방 등급\n' +
    '  "bodyType": "근육 부족형" | "체지방 과다형" | "균형형" | "분석 실패",\n' +
    '  "summary": string,          // 1-2 sentence analysis\n' +
    '  "recommendation": string,   // product recommendation\n' +
    '  "confidence": "high" | "medium" | "low"\n' +
    '}\n' +
    '\n' +
    'Return only valid JSON. Do not wrap in markdown code blocks or add extra explanation.';

  const userContext = userId ? `사용자 ID: ${userId}\n` : '';

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: 'You extract Inbody/body composition metrics into JSON.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: `${userContext}${BODY_ANALYSIS_PROMPT}` },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ] as any,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 512,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = BodyAnalysisSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      console.error('체성분 분석 파싱 실패:', parsed.error);
      return {
        skeletalMuscleKg: undefined,
        bodyFatPercent: undefined,
        visceralFatLevel: undefined,
        bodyType: '분석 실패',
        summary: '체성분 수치를 추출하지 못했습니다.',
        recommendation: '',
        confidence: 'low',
        valid: false,
      };
    }

    const disclaimer = '(본 분석은 참고용이며, 정확한 건강 상태는 전문의와 상담하세요.)';
    const summary = parsed.data.summary
      ? parsed.data.summary.includes('전문의') || parsed.data.summary.includes('의사')
        ? parsed.data.summary
        : `${parsed.data.summary} ${disclaimer}`
      : '분석 결과를 얻지 못했습니다.';

    return validateBodyMetrics({
      ...parsed.data,
      summary,
    });
  } catch (err) {
    console.error('OpenAI Vision 체성분 분석 오류:', err);
    return {
      skeletalMuscleKg: undefined,
      bodyFatPercent: undefined,
      visceralFatLevel: undefined,
      bodyType: '분석 실패',
      summary: '이미지 분석 중 문제가 발생했습니다.',
      recommendation: '',
      confidence: 'low',
      valid: false,
    };
  }
}

export async function generateNewsletter(month: string) {
  if (!openai) {
    return `[MOCK] ${month}월 웰니스 뉴스레터: 신제품 출시, 세미나 안내, 건강 팁.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        {
          role: 'user',
          content: `${month}월 뉴스레터용 시즌 인사말과 암웨이 신제품/세미나 핵심 요약을 200자 이내로 작성해주세요.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 256,
    });

    return completion.choices[0]?.message?.content || `${month}월 웰니스 소식: 건강한 한 달 되세요.`;
  } catch (err) {
    console.error('OpenAI 뉴스레터 생성 오류:', err);
    return `${month}월 웰니스 소식: 건강한 한 달 되세요.`;
  }
}
