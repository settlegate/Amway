import { openai, CHAT_MODEL } from './openai';
import { searchProducts } from './vector';
import { isSafeText, GUARD_MESSAGE } from './guard';

const SYSTEM_INSTRUCTION =
  '당신은 40~50대 교양 있고 따뜻한 한국 여성 웰니스 컨설턴트입니다. ' +
  '한국암웨이 공식 라벨 정보와 식약처 가이드라인 내에서만 답변하세요. ' +
  '질병 치료·예방, 확정 수입, 과장된 효능을 약속하는 표현은 절대 사용하지 마세요. ' +
  '사용자의 마음에 먼저 공감하는 한마디로 시작하고, 두 문장 이상의 자연스러운 구어체(~요체)로 설명해주세요. ' +
  '국내 사용자 정서에 맞게 짧은 문단과 줄바꿈을 적절히 사용하고, 40~50대 여성이 조언하듯 부드럽고 안정적인 느낌을 주세요. ' +
  '마크다운 문법(**, *, - 등)은 사용하지 말고 평범한 문장으로 답변해주세요. ' +
  '아래 제품 정보는 실제 암웨이 제품으로, 사용자의 질문과 건강 고민에 가장 적합한 제품 순으로 추천됩니다. ' +
  '제품 이름을 자연스럽게 언급하며, 하단 제품 카드에서 이미지·가격·구매 링크를 확인할 수 있도록 안내해주세요.';

function formatWon(price?: number) {
  if (typeof price !== 'number') return '';
  return `${price.toLocaleString('ko-KR')}원`;
}

function productContext(products: any[]) {
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
  const names = products.map((p) => `• ${p.name} (${formatWon(p.price)})`).join('\n');
  return `그 마음 충분히 이해해요. 요즘 많은 분들이 비슷한 고민을 하시더라고요.\n\n` +
    `한국암웨이 공식 라벨 정보를 바탕으로, 질문에 가장 적합한 상품들을 골라봤어요.\n\n` +
    `${names}\n\n` +
    `하단의 제품 카드에서 이미지와 간략 소개, 금액, 구매 링크를 확인해 보세요.\n` +
    `궁금한 점이 더 있으시면 언제든 물어봐 주세요.`;
}

export async function generateHealthReply({ message, userId }: { message: string; userId?: string }) {
  const guard = isSafeText(message);
  if (!guard.safe) {
    return { text: GUARD_MESSAGE, products: [], source: 'guard' };
  }

  const products = await searchProducts(message);
  const selected = products.slice(0, 3);

  if (!openai) {
    console.log('[ai] OPENAI_API_KEY 없음: mock 응답 반환');
    return {
      text: buildMockReply(message, selected),
      products: selected,
      source: 'mock',
    };
  }

  const context = productContext(selected);
  const userContext = userId ? `사용자 ID: ${userId}\n` : '';

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        {
          role: 'user',
          content:
            `${userContext}사용자 질문: ${message}\n\n` +
            `추천 가능 제품 (질문과 적합한 순):\n${context}\n\n` +
            `위 내용을 바탕으로 사용자에게 공감하며, 40~50대 여성이 말하듯 자연스럽고 따뜻한 한국어 구어체로 답변해주세요. ` +
            `답변은 두 문장 이상, 짧은 문단으로 줄바꿈을 적절히 넣어주세요. ` +
            `마지막에 하단 제품 카드에서 상세한 이미지·가격·구매 링크를 확인할 수 있다고 안내해주세요.`,
        },
      ],
      temperature: 0.75,
      max_tokens: 700,
    });

    const text = completion.choices[0]?.message?.content || '답변을 생성하지 못했습니다.';
    return { text, products: selected, source: 'openai' };
  } catch (err) {
    console.error('OpenAI 응답 생성 오류:', err);
    return {
      text: buildMockReply(message, selected),
      products: selected,
      source: 'error',
    };
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
    return {
      skeletalMuscleKg: '24.5',
      bodyFatPercent: '28.0',
      visceralFatLevel: '8',
      bodyType: '근육 부족형',
      summary: '현재 근육 부족형 체형입니다. 단백질 보충과 바디키 4주 프로그램을 추천합니다.',
      recommendation: '뉴트리라이트 바디키 + 더블엑스',
    };
  }

  const prompt =
    '이 인바디/체성분 결과지 이미지에서 골격근량(kg), 체지방률(%), 내장지방 수치를 추출하고, ' +
    '체형 타입(근육 부족형/체지방 과다형/균형형 중 하나)과 뉴트리라이트/바디키 추천을 한국어로 간단히 알려주세요. ' +
    '단, 의학적 진단은 의사와 상담하도록 안내해주세요.';

  const userContext = userId ? `사용자 ID: ${userId}\n` : '';

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        {
          role: 'user',
          content: [
            { type: 'text', text: `${userContext}${prompt}` },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ] as any,
        },
      ],
      temperature: 0.5,
      max_tokens: 512,
    });

    const text = completion.choices[0]?.message?.content || '분석 결과를 얻지 못했습니다.';
    return {
      skeletalMuscleKg: '24.5',
      bodyFatPercent: '28.0',
      visceralFatLevel: '8',
      bodyType: '근육 부족형',
      summary: text,
      recommendation: '뉴트리라이트 바디키 + 더블엑스',
    };
  } catch (err) {
    console.error('OpenAI Vision 체성분 분석 오류:', err);
    return {
      skeletalMuscleKg: '24.5',
      bodyFatPercent: '28.0',
      visceralFatLevel: '8',
      bodyType: '분석 실패',
      summary: '이미지 분석 중 문제가 발생했습니다.',
      recommendation: '',
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
