import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enrichWithNutrientInfo } from '../../src/lib/nutrients';

const h = vi.hoisted(() => ({ client: null as any, create: vi.fn() }));

vi.mock('../../src/lib/openai', () => ({
  get openai() {
    return h.client;
  },
  CHAT_MODEL: 'test-model',
}));

const HEADER = '★ 영양소 정보';

beforeEach(() => {
  h.client = null;
});

describe('enrichWithNutrientInfo (OpenAI 미설정)', () => {
  it('영양소 용어가 없으면 원문을 그대로 반환한다', async () => {
    await expect(enrichWithNutrientInfo('규칙적인 운동을 해보세요.')).resolves.toBe('규칙적인 운동을 해보세요.');
  });

  it('매칭된 영양소의 기본 설명 블록을 덧붙인다', async () => {
    const result = await enrichWithNutrientInfo('루테인과 오메가-3를 챙겨보세요.   ');

    expect(result.startsWith('루테인과 오메가-3를 챙겨보세요.\n\n')).toBe(true);
    expect(result).toContain(HEADER);
    expect(result).toContain('• 루테인: ');
    expect(result).toContain('• 오메가-3: ');
    // 긴 용어가 먼저 매칭되어 짧은 용어(오메가3)가 중복 매칭되지 않는다
    expect(result).not.toContain('• 오메가3:');
  });

  it('대소문자를 구분하지 않고 매칭한다', async () => {
    const result = await enrichWithNutrientInfo('epa가 풍부한 식단');
    expect(result).toContain('• EPA: ');
  });

  it('다른 단어의 일부로 포함된 용어는 매칭하지 않는다', async () => {
    await expect(enrichWithNutrientInfo('고칼슘 식단')).resolves.toBe('고칼슘 식단');
  });
});

describe('enrichWithNutrientInfo (OpenAI 설정)', () => {
  beforeEach(() => {
    h.client = { chat: { completions: { create: h.create } } };
  });

  it('생성된 블록에 헤더가 없으면 헤더를 붙인다', async () => {
    h.create.mockResolvedValue({ choices: [{ message: { content: '• 마그네슘: 설명' } }] });

    const result = await enrichWithNutrientInfo('마그네슘이 도움이 될 수 있어요.');

    expect(result).toBe(`마그네슘이 도움이 될 수 있어요.\n\n${HEADER}\n• 마그네슘: 설명`);
    const args = h.create.mock.calls[0][0];
    expect(args.model).toBe('test-model');
    expect(args.messages[0].content).toContain('마그네슘');
  });

  it('생성된 블록이 헤더로 시작하면 그대로 사용한다', async () => {
    h.create.mockResolvedValue({ choices: [{ message: { content: `${HEADER}\n• 아연: 설명` } }] });

    const result = await enrichWithNutrientInfo('아연');

    expect(result).toBe(`아연\n\n${HEADER}\n• 아연: 설명`);
  });

  it.each([
    ['빈 응답', { choices: [{ message: { content: '   ' } }] }],
    ['choices 없음', { choices: [] }],
  ])('%s이면 기본 설명 블록으로 대체한다', async (_label, response) => {
    h.create.mockResolvedValue(response);

    const result = await enrichWithNutrientInfo('철분');

    expect(result).toContain(`${HEADER}\n• 철분: `);
  });
});
