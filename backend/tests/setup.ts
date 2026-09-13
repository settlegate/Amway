import { beforeEach, vi } from 'vitest';

process.env.NODE_ENV = 'test';

// 로컬 .env 값이 테스트 결과에 영향을 주지 않도록 외부 연동 키를 제거
for (const key of [
  'OPENAI_API_KEY',
  'OPENAI_CHAT_MODEL',
  'OPENAI_EMBEDDING_MODEL',
  'PINECONE_API_KEY',
  'PINECONE_INDEX',
  'ENCRYPTION_KEY',
  'KAKAO_CHANNEL_TOKEN',
  'KAKAO_API_KEY',
  'KAKAO_API_BASE',
  'FRONTEND_URL',
  'PORT',
]) {
  delete process.env[key];
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
