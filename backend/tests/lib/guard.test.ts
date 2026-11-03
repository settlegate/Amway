import { describe, expect, it } from 'vitest';
import { GUARD_MESSAGE, isBlockedInput, isSafeText } from '../../src/lib/guard';

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

  it.each(['치 료 효과 있나요', '치-료 되나요', '치.료.법 알려줘', '완 치 보장'])('띄어쓰기·기호 우회 "%s"도 차단한다', (text) => {
    expect(isSafeText(text).safe).toBe(false);
  });

  it('안내 문구는 전문의 상담을 권한다', () => {
    expect(GUARD_MESSAGE).toContain('전문의');
  });
});

describe('isBlockedInput', () => {
  it.each([
    ['이 제품으로 완치되나요?', '완치'],
    ['월 100만원 수익 보장이죠?', '월 100'],
    ['무조건 효과 있어요?', '무조건'],
  ])('과대광고 표현 "%s"는 차단한다', (text, matched) => {
    expect(isBlockedInput(text)).toEqual({ safe: false, matched });
  });

  it.each([
    '당뇨가 있는데 추천해주세요',
    '감기 예방에 도움 되는 제품 있나요',
    '치료 후 회복 중인데 영양제 추천해주세요',
    '고혈압 약을 먹고 있어요',
  ])('정상적인 건강 질문 "%s"는 허용한다', (text) => {
    expect(isBlockedInput(text).safe).toBe(true);
  });
});
