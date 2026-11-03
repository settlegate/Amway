// 사용자에게 그대로 보여줘도 되는 오류 — 라우트는 이 타입만 메시지를 노출하고 나머지는 일반 문구를 반환한다
export class UserFacingError extends Error {}
