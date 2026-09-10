// 기능성/의료 광고 금지어 필터링
const BANNED_KEYWORDS = [
  '암 완치',
  '무조건 살 빠짐',
  '월 1천만 원 확정 수입',
  '월 1000',
  '치료',
  '완치',
  '무조건',
  '확정 수입',
];

export function isSafeText(text: string): { safe: boolean; matched?: string } {
  const lowered = text.toLowerCase();
  for (const keyword of BANNED_KEYWORDS) {
    if (lowered.includes(keyword.toLowerCase())) {
      return { safe: false, matched: keyword };
    }
  }
  return { safe: true };
}

export const GUARD_MESSAGE =
  '해당 문의는 한국암웨이 공식 라벨 및 식약처 가이드라인 범위에서 안전하게 답변드릴 수 없습니다. 건강상의 우려가 있으시면 전문의와 상담해 주세요.';
