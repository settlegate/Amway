import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import dotenv from 'dotenv';

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    readonly mocked = true;
  },
}));
vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

describe('db', () => {
  it('PrismaClient 싱글턴 인스턴스를 export 한다', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const { prisma } = await import('../../src/lib/db');

    expect(prisma).toBeInstanceOf(PrismaClient);
  });
});

describe('env', () => {
  it('프로젝트 루트의 .env 파일을 로드한다', async () => {
    await import('../../src/env');

    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../.env'),
    });
  });
});
