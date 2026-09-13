import { describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ embeddingsCreate: vi.fn(), options: [] as any[] }));

vi.mock('openai', () => ({
  default: class {
    embeddings = { create: h.embeddingsCreate };
    constructor(opts: any) {
      h.options.push(opts);
    }
  },
}));

async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('../../src/lib/openai');
}

describe('openai', () => {
  it('API 키가 없으면 클라이언트는 null이고 기본 모델을 사용한다', async () => {
    const mod = await load();
    expect(mod.openai).toBeNull();
    expect(mod.CHAT_MODEL).toBe('gpt-4o-mini');
    expect(mod.EMBEDDING_MODEL).toBe('text-embedding-3-small');
    await expect(mod.createEmbedding('text')).rejects.toThrow('OPENAI_API_KEY');
  });

  it('API 키와 모델 환경 변수를 사용해 임베딩을 생성한다', async () => {
    h.embeddingsCreate.mockResolvedValue({ data: [{ embedding: [0.1, 0.2] }] });
    const mod = await load({
      OPENAI_API_KEY: 'sk-test',
      OPENAI_CHAT_MODEL: 'chat-x',
      OPENAI_EMBEDDING_MODEL: 'embed-x',
    });

    expect(mod.openai).not.toBeNull();
    expect(h.options.at(-1)).toEqual({ apiKey: 'sk-test' });
    expect(mod.CHAT_MODEL).toBe('chat-x');
    await expect(mod.createEmbedding('눈 건강')).resolves.toEqual([0.1, 0.2]);
    expect(h.embeddingsCreate).toHaveBeenCalledWith({ model: 'embed-x', input: '눈 건강' });
  });
});
