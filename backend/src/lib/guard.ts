// 기능성/의료 광고 금지어 필터링
// 항상 차단(사용자 입력도 차단): 치료·수입을 단정하는 명백한 과대광고 표현
const HARD_KEYWORDS = [
  '무조건 살 빠짐',
  '암 완치',
  '월 1천만 원 확정 수입',
  '다이어트 확정',
  '완치',
  '치료제',
  '치료법',
  '무조건',
  '확정 수입',
  '확약',
  '살 빠짐',
  'kg 감량',
  '월 1천만',
  '월 1천',
  '월 1000',
  '월 100',
  '월 500',
];

// 문맥 확인 필요: 정상적인 건강 질문에도 등장하는 단어 — 입력은 허용하고 AI 응답만 차단
const CONTEXT_KEYWORDS = ['치료', '예방', '확실히', '반드시', '확정', '한 달에', '암', '당뇨', '고혈압', '심장병', '뇌졸중'];

const BANNED_KEYWORDS = [...HARD_KEYWORDS, ...CONTEXT_KEYWORDS];

// 띄어쓰기·기호 우회(치 료, 치-료)를 막기 위해 문자·숫자만 남기고 비교
const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

const matchAny = (text: string, keywords: string[]) => {
  const normalized = normalize(text);
  return keywords.find((keyword) => normalized.includes(normalize(keyword)));
};

export function isSafeText(text: string): { safe: boolean; matched?: string } {
  const matched = matchAny(text, BANNED_KEYWORDS);
  return matched ? { safe: false, matched } : { safe: true };
}

// 사용자 입력·클라이언트 제공 대화 이력에는 명백한 과대광고 표현만 차단
export function isBlockedInput(text: string): { safe: boolean; matched?: string } {
  const matched = matchAny(text, HARD_KEYWORDS);
  return matched ? { safe: false, matched } : { safe: true };
}

export const GUARD_MESSAGE =
  '해당 문의는 한국암웨이 공식 라벨 및 식약처 가이드라인 범위에서 안전하게 답변드릴 수 없습니다. 건강상의 우려가 있으시면 전문의와 상담해 주세요.';
