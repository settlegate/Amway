import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeBodyImage, generateHealthReply, generateNewsletter } from '../../src/lib/ai';
import { GUARD_MESSAGE } from '../../src/lib/guard';
import { searchProducts } from '../../src/lib/vector';
import { enrichWithNutrientInfo } from '../../src/lib/nutrients';

const h = vi.hoisted(() => ({ client: null as any, create: vi.fn() }));

vi.mock('../../src/lib/openai', () => ({
  get openai() {
    return h.client;
  },
  CHAT_MODEL: 'test-model',
}));
vi.mock('../../src/lib/vector', () => ({ searchProducts: vi.fn() }));
vi.mock('../../src/lib/nutrients', () => ({ enrichWithNutrientInfo: vi.fn() }));

const search = vi.mocked(searchProducts);
const enrich = vi.mocked(enrichWithNutrientInfo);

const FOOTER = '\n\n더 나은 건강 상담과 제품 추천은 정주희 ABO에게 문의하세요^^';
const DISCLAIMER = '(본 분석은 참고용이며, 정확한 건강 상태는 전문의와 상담하세요.)';

const product = (id: string, extra: Record<string, any> = {}) =>
  ({ id, code: id, name: `제품${id}`, category: 'c', imageUrl: '', price: 10000, ...extra }) as any;

const completion = (content: string | null) => ({ choices: [{ message: { content } }] });

function useOpenAI() {
  h.client = { chat: { completions: { create: h.create } } };
}

beforeEach(() => {
  h.client = null;
  search.mockResolvedValue([]);
  enrich.mockImplementation(async (text) => text);
});

describe('generateHealthReply (공통)', () => {
  it('금지어가 포함된 질문은 검색 없이 차단한다', async () => {
    const result = await generateHealthReply({ message: '암 완치 방법 알려줘' });

    expect(result).toEqual({ text: GUARD_MESSAGE, products: [], source: 'guard' });
    expect(search).not.toHaveBeenCalled();
  });

  it('공백 메시지는 제품 검색을 건너뛰고 일반 조언을 준다', async () => {
    const result = await generateHealthReply({ message: '   ' });

    expect(search).not.toHaveBeenCalled();
    expect(result.source).toBe('mock');
    expect(result.products).toEqual([]);
    expect(result.text).toContain('규칙적인 식사');
    expect(result.text.endsWith(FOOTER)).toBe(true);
  });

  it.each([
    ['잠이 안 와요', '수면 마그네슘'],
    ['눈이 피로해요', '눈 루테인'],
    ['요즘 피곤해요', '피로 코큐텐 비타민B'],
    ['피부 탄력이 걱정', '피부 콜라겐 히알루론산'],
    ['소화가 잘 안돼요', '장 유산균'],
    ['감기에 자주 걸려요', '면역 홍삼 비타민C'],
    ['관절이 아파요', '뼈 칼슘 비타민D'],
    ['다이어트 중이에요', '체중 식이섬유'],
    ['콜레스테롤 수치', '혈행 오메가3 EPA'],
    ['어제 술을 마셨어요', '간 밀크씨슬'],
    ['집중이 안돼요', '기억 포스파티딜세린'],
  ])('"%s" 질문은 검색어에 "%s"를 추가한다', async (message, extra) => {
    await generateHealthReply({ message });
    expect(search.mock.calls[0][0]).toContain(`${message} `);
    expect(search.mock.calls[0][0]).toContain(extra);
  });

  it('관련 키워드가 없으면 원문으로 검색한다', async () => {
    await generateHealthReply({ message: 'hello' });
    expect(search).toHaveBeenCalledWith('hello');
  });
});

describe('generateHealthReply (OpenAI 미설정)', () => {
  it('체성분 키워드 검색 결과와 메시지 검색 결과를 합쳐 최대 3개를 추천한다', async () => {
    search.mockImplementation(async (q) => {
      if (q === '단백질') return [product('protein', { price: 91000 })];
      if (q === '바디키') return [product('bodykey', { price: undefined })];
      if (q === '오메가3') return [product('omega')];
      if (q === 'hello') return [product('protein'), product('msg')];
      return [];
    });

    const result = await generateHealthReply({
      message: 'hello',
      bodyMetrics: { skeletalMuscleKg: 18, bodyFatPercent: 35, visceralFatLevel: 10, bodyType: '근육 부족형' },
    });

    expect(search.mock.calls.map((c) => c[0])).toEqual([
      'hello', '단백질', '바디키', '바디키', '체지방', '오메가3', '코큐텐', '단백질',
    ]);
    expect(result.source).toBe('mock');
    expect(result.products.map((p: any) => p.id)).toEqual(['protein', 'bodykey', 'omega']);
    expect(result.text).toContain('• 제품protein (10,000원)');
    expect(result.text).toContain('• 제품bodykey ()');
  });

  it('체지방 과다형은 바디키를, 기준 미만 수치는 추가 키워드를 만들지 않는다', async () => {
    await generateHealthReply({
      message: 'hello',
      bodyMetrics: { skeletalMuscleKg: 30, bodyFatPercent: 20, visceralFatLevel: 5, bodyType: '체지방 과다형' },
    });
    expect(search.mock.calls.map((c) => c[0])).toEqual(['hello', '바디키']);
  });
});

describe('generateHealthReply (OpenAI 설정)', () => {
  beforeEach(useOpenAI);

  it('대화 이력·제품 정보를 프롬프트에 담고 관련 제품과 영양 정보를 덧붙인다', async () => {
    const selected = [
      product('p1', { description: '설명1', benefits: ['면역', '피로'], dosage: '식후 1정' }),
      product('p2', { benefits: '눈 건강' }),
      product('p3'),
    ];
    search.mockImplementation(async (q) => {
      if (q === '루테인') return [selected[0], product('p9'), product('p9')];
      return selected;
    });
    h.create.mockResolvedValue(completion('루테인이 도움이 될 수 있어요.'));
    enrich.mockImplementation(async (text) => `${text}\n\n★ 영양소 정보`);
    const history = Array.from({ length: 12 }, (_, i) => ({
      role: (i % 2 ? 'ai' : 'user') as 'ai' | 'user',
      text: `turn-${i}`,
    }));

    const result = await generateHealthReply({ message: 'hello', userId: 'u1', history });

    const { messages, model } = h.create.mock.calls[0][0];
    expect(model).toBe('test-model');
    expect(messages).toHaveLength(12);
    expect(messages[0].role).toBe('system');
    expect(messages[1]).toEqual({ role: 'user', content: 'turn-2' });
    expect(messages[2]).toEqual({ role: 'assistant', content: 'turn-3' });
    const prompt = messages[11].content;
    expect(prompt).toContain('사용자 ID: u1');
    expect(prompt).toContain('[1] 제품p1 (10,000원)');
    expect(prompt).toContain('- 간략 소개: 설명1');
    expect(prompt).toContain('- 주요 기능: 면역, 피로');
    expect(prompt).toContain('- 섭취법: 식후 1정');
    expect(prompt).toContain('- 주요 기능: 눈 건강');
    expect(prompt).toContain('- 간략 소개: 한국암웨이 공식 제품');
    expect(prompt).toContain('- 섭취법: 식사 후');
    expect(prompt).not.toContain('User body composition');

    expect(search).toHaveBeenCalledWith('루테인');
    expect(result.products.map((p: any) => p.id)).toEqual(['p1', 'p2', 'p3', 'p9']);
    expect(result).toMatchObject({ source: 'openai' });
    expect(result.text).toBe(`루테인이 도움이 될 수 있어요.\n\n★ 영양소 정보${FOOTER}`);
  });

  it('체성분 수치가 있으면 프롬프트에 포함하고 의료 면책 문구를 붙인다', async () => {
    h.create.mockResolvedValue(completion('근력 운동을 병행해 보세요.'));

    const result = await generateHealthReply({
      message: 'hello',
      bodyMetrics: { bodyType: '균형형' },
    });

    const prompt = h.create.mock.calls[0][0].messages.at(-1).content;
    expect(prompt).toContain('User body composition:\nbody type: 균형형');
    expect(prompt).toContain('추천 가능한 제품: 없습니다.');
    expect(prompt).not.toContain('사용자 ID');
    expect(result.text).toBe(`근력 운동을 병행해 보세요.\n\n${DISCLAIMER}${FOOTER}`);
  });

  it('체성분 수치 전체를 프롬프트 컨텍스트로 변환한다', async () => {
    h.create.mockResolvedValue(completion('ok'));

    await generateHealthReply({
      message: 'hello',
      bodyMetrics: { skeletalMuscleKg: 25, bodyFatPercent: 22, visceralFatLevel: 4 },
    });

    const prompt = h.create.mock.calls[0][0].messages.at(-1).content;
    expect(prompt).toContain('skeletal muscle: 25kg\nbody fat: 22%\nvisceral fat: 4');
  });

  it('응답이 비어 있으면 기본 문구를 사용한다', async () => {
    h.create.mockResolvedValue({ choices: [] });

    const result = await generateHealthReply({ message: 'hello' });

    expect(result.text).toBe(`답변을 생성하지 못했습니다.${FOOTER}`);
  });

  it('이미 ABO 안내 문구가 있으면 중복으로 붙이지 않는다', async () => {
    const text = '답변입니다.\n\n더 나은 건강 상담과 제품 추천은 정주희 ABO에게 문의하세요^^';
    h.create.mockResolvedValue(completion(text));

    const result = await generateHealthReply({ message: 'hello' });

    expect(result.text).toBe(text);
  });

  it('AI 응답에 금지어가 있으면 안내 문구로 대체한다', async () => {
    search.mockResolvedValue([product('p1')]);
    h.create.mockResolvedValue(completion('이 제품은 치료 효과가 있어요.'));

    const result = await generateHealthReply({ message: 'hello' });

    expect(result).toEqual({ text: `${GUARD_MESSAGE}${FOOTER}`, products: [product('p1')], source: 'guard' });
    expect(enrich).not.toHaveBeenCalled();
  });

  it('영양 정보 보강 후 금지어가 생기면 안내 문구로 대체한다', async () => {
    h.create.mockResolvedValue(completion('좋은 습관이에요.'));
    enrich.mockResolvedValue('좋은 습관이에요. 질병 예방');

    const result = await generateHealthReply({ message: 'hello' });

    expect(result.source).toBe('guard');
    expect(result.text).toBe(`${GUARD_MESSAGE}${FOOTER}`);
  });

  it('OpenAI 호출이 실패하면 mock 답변으로 대체한다', async () => {
    h.create.mockRejectedValue(new Error('timeout'));

    const result = await generateHealthReply({ message: 'hello' });

    expect(result.source).toBe('error');
    expect(result.text).toContain('규칙적인 식사');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('analyzeBodyImage', () => {
  it('OpenAI 미설정 시 mock 분석 결과를 반환한다', async () => {
    const result = await analyzeBodyImage({ imageBase64: 'abc' });

    expect(result).toMatchObject({ skeletalMuscleKg: 24.5, bodyType: '근육 부족형', valid: true });
  });

  describe('OpenAI 설정', () => {
    beforeEach(useOpenAI);

    it('이미지를 전송하고 추출 수치에 면책 문구를 붙인다', async () => {
      h.create.mockResolvedValue(
        completion(JSON.stringify({
          skeletalMuscleKg: '25.1',
          bodyFatPercent: 28,
          visceralFatLevel: 7,
          bodyType: '균형형',
          summary: '균형 잡힌 체형이에요.',
          confidence: 'high',
        })),
      );

      const result = await analyzeBodyImage({ imageBase64: 'BASE64', mimeType: 'image/jpeg', userId: 'u1' });

      const content = h.create.mock.calls[0][0].messages[1].content;
      expect(content[0].text.startsWith('사용자 ID: u1\n')).toBe(true);
      expect(content[1].image_url.url).toBe('data:image/jpeg;base64,BASE64');
      expect(result).toMatchObject({
        skeletalMuscleKg: 25.1,
        summary: `균형 잡힌 체형이에요. ${DISCLAIMER}`,
        valid: true,
      });
    });

    it.each(['전문의와 상담하세요.', '의사와 상의하세요.'])('요약에 "%s"가 이미 있으면 그대로 둔다', async (summary) => {
      h.create.mockResolvedValue(completion(JSON.stringify({ bodyFatPercent: 20, summary })));

      const result = await analyzeBodyImage({ imageBase64: 'x' });

      expect(result.summary).toBe(summary);
      const content = h.create.mock.calls[0][0].messages[1].content;
      expect(content[0].text.startsWith('Extract')).toBe(true);
      expect(content[1].image_url.url).toBe('data:image/png;base64,x');
    });

    it('수치가 비정상 범위면 valid=false로 표시한다', async () => {
      h.create.mockResolvedValue(completion(JSON.stringify({ bodyFatPercent: 70, visceralFatLevel: 5 })));

      const result = await analyzeBodyImage({ imageBase64: 'x' });

      expect(result).toMatchObject({ bodyFatPercent: 70, valid: false, summary: '분석 결과를 얻지 못했습니다.' });
    });

    it('응답이 비어 있으면 수치 없음으로 valid=false를 반환한다', async () => {
      h.create.mockResolvedValue(completion(null));

      const result = await analyzeBodyImage({ imageBase64: 'x' });

      expect(result.valid).toBe(false);
    });

    it('스키마 검증에 실패하면 분석 실패 결과를 반환한다', async () => {
      h.create.mockResolvedValue(completion(JSON.stringify({ bodyType: '알 수 없음' })));

      const result = await analyzeBodyImage({ imageBase64: 'x' });

      expect(result).toMatchObject({ bodyType: '분석 실패', summary: '체성분 수치를 추출하지 못했습니다.', valid: false });
    });

    it('JSON 파싱 오류가 나면 이미지 분석 오류 결과를 반환한다', async () => {
      h.create.mockResolvedValue(completion('not-json'));

      const result = await analyzeBodyImage({ imageBase64: 'x' });

      expect(result).toMatchObject({ bodyType: '분석 실패', summary: '이미지 분석 중 문제가 발생했습니다.', valid: false });
    });
  });
});

describe('generateNewsletter', () => {
  it('OpenAI 미설정 시 mock 뉴스레터를 반환한다', async () => {
    await expect(generateNewsletter('2026-09')).resolves.toBe('[MOCK] 2026-09월 웰니스 뉴스레터: 신제품 출시, 세미나 안내, 건강 팁.');
  });

  describe('OpenAI 설정', () => {
    beforeEach(useOpenAI);

    it('생성된 뉴스레터를 반환한다', async () => {
      h.create.mockResolvedValue(completion('9월 뉴스레터'));
      await expect(generateNewsletter('9')).resolves.toBe('9월 뉴스레터');
      expect(h.create.mock.calls[0][0].messages[1].content).toContain('9월 뉴스레터용');
    });

    it('빈 응답이면 기본 문구를 반환한다', async () => {
      h.create.mockResolvedValue(completion(''));
      await expect(generateNewsletter('9')).resolves.toBe('9월 웰니스 소식: 건강한 한 달 되세요.');
    });

    it('호출 오류 시 기본 문구를 반환한다', async () => {
      h.create.mockRejectedValue(new Error('fail'));
      await expect(generateNewsletter('9')).resolves.toBe('9월 웰니스 소식: 건강한 한 달 되세요.');
    });
  });
});
