import rateLimit from 'express-rate-limit';

const skipInTest = () => process.env.NODE_ENV === 'test';

// 채팅: IP당 분당 10회
export const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
});

// 체성분 이미지 분석(GPT-4o Vision): IP당 시간당 20회
export const imageChatLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => skipInTest() || !(typeof req.body?.imageBase64 === 'string' && req.body.imageBase64),
  message: { error: '이미지 분석 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.' },
});

// 카카오 웹훅: IP당 분당 30회
export const kakaoWebhookLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: '요청이 너무 많습니다.' },
});
