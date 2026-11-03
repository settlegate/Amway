import { describe, expect, it } from 'vitest';
import { addDays, kstDay } from '../../src/lib/analytics';

describe('kstDay', () => {
  it('KST 기준 YYYY-MM-DD를 반환한다', () => {
    expect(kstDay(new Date('2026-11-02T20:00:00Z'))).toBe('2026-11-03');
    expect(kstDay(new Date('2026-11-03T14:59:59Z'))).toBe('2026-11-03');
    expect(kstDay(new Date('2026-11-03T15:00:00Z'))).toBe('2026-11-04');
  });
});

describe('addDays', () => {
  it('날짜를 더하고 뺀다', () => {
    expect(addDays('2026-11-03', -6)).toBe('2026-10-28');
    expect(addDays('2026-11-03', 1)).toBe('2026-11-04');
  });

  it('월/연 경계를 넘는다', () => {
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
  });
});
