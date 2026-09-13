import { describe, expect, it } from 'vitest';
import { GUARD_MESSAGE, isSafeText } from '../../src/lib/guard';

describe('isSafeText', () => {
  it('금지어가 없으면 safe를 반환한다', () => {
    expect(isSafeText('피로 회복에 좋은 영양제를 알려주세요')).toEqual({ safe: true });
  });

  it.each([
    ['이 제품으로 암 완치가 가능한가요?', '암 완치'],
    ['무조건 살 빠짐 보장', '무조건 살 빠짐'],
    ['감기 예방에 좋나요', '예방'],
    ['당뇨에 좋은 음식', '당뇨'],
  ])('금지어를 포함한 문장 "%s"는 차단한다', (text, matched) => {
    expect(isSafeText(text)).toEqual({ safe: false, matched });
  });

  it('대소문자를 구분하지 않는다', () => {
    expect(isSafeText('한 달 만에 5KG 감량')).toEqual({ safe: false, matched: 'kg 감량' });
  });

  it('안내 문구는 전문의 상담을 권한다', () => {
    expect(GUARD_MESSAGE).toContain('전문의');
  });
});
