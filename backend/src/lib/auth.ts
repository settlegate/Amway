import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function sign(value: string) {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET ?? '')
    .update(value)
    .digest('hex');
}

export function createAdminToken(now = Date.now()) {
  const expires = String(now + TOKEN_TTL_MS);
  return `${expires}.${sign(expires)}`;
}

function verifyAdminToken(token: string) {
  if (!process.env.ADMIN_SESSION_SECRET) return false;
  const [expires, sig] = token.split('.');
  if (!expires || !sig || Number.isNaN(Number(expires))) return false;
  if (Number(expires) <= Date.now()) return false;
  const expected = sign(expires);
  return (
    sig.length === expected.length &&
    timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (verifyAdminToken(token)) {
    next();
    return;
  }
  res.status(401).json({ error: '관리자 인증이 필요합니다.' });
}

export function adminLogin(req: Request, res: Response) {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (rec && rec.lockedUntil > now) {
    res.status(429).json({ error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' });
    return;
  }

  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const expected = process.env.ADMIN_PASSWORD ?? '';
  const matched =
    expected !== '' &&
    password.length === expected.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expected));

  if (!matched) {
    const count = (rec?.count ?? 0) + 1;
    loginAttempts.set(ip, {
      count,
      lockedUntil: count >= MAX_ATTEMPTS ? now + LOCK_MS : 0,
    });
    res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    return;
  }

  loginAttempts.delete(ip);
  res.json({ token: createAdminToken(now), expiresIn: TOKEN_TTL_MS / 1000 });
}

export function resetLoginAttempts() {
  loginAttempts.clear();
}
