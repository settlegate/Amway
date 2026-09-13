import { describe, expect, it, vi } from 'vitest';

const KEY = 'a'.repeat(64);

async function load(key?: string) {
  vi.resetModules();
  if (key !== undefined) vi.stubEnv('ENCRYPTION_KEY', key);
  return import('../../src/lib/crypto');
}

describe('crypto (키 없음)', () => {
  it('encrypt는 경고 후 평문을 반환한다', async () => {
    const { encrypt } = await load();
    expect(encrypt('010-1234-5678')).toBe('010-1234-5678');
    expect(console.warn).toHaveBeenCalled();
  });

  it('decrypt는 입력을 그대로 반환한다', async () => {
    const { decrypt } = await load();
    expect(decrypt('abc:def')).toBe('abc:def');
  });

  it('64자가 아닌 키는 무시한다', async () => {
    const { encrypt } = await load('abcd');
    expect(encrypt('plain')).toBe('plain');
  });
});

describe('crypto (AES-256 키 설정)', () => {
  it('암호화 후 복호화하면 원문이 복원된다', async () => {
    const { encrypt, decrypt } = await load(KEY);
    const cipher = encrypt('010-1234-5678');

    expect(cipher).toMatch(/^[0-9a-f]{32}:[0-9a-f]+$/);
    expect(cipher).not.toContain('010');
    expect(decrypt(cipher)).toBe('010-1234-5678');
  });

  it('같은 평문이라도 IV가 달라 매번 다른 암호문을 만든다', async () => {
    const { encrypt } = await load(KEY);
    expect(encrypt('same')).not.toBe(encrypt('same'));
  });

  it.each(['no-separator', 'abc:', ':abc'])('형식이 잘못된 암호문 "%s"는 그대로 반환한다', async (value) => {
    const { decrypt } = await load(KEY);
    expect(decrypt(value)).toBe(value);
  });
});
