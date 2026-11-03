import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const KEY_HEX = process.env.ENCRYPTION_KEY || '';

const KEY: Buffer | null =
  KEY_HEX.length === 64 ? Buffer.from(KEY_HEX, 'hex') : null;

if (process.env.NODE_ENV === 'production' && !KEY) {
  throw new Error('운영 환경(NODE_ENV=production)에서는 ENCRYPTION_KEY(64자 hex)가 필수입니다.');
}

export function encrypt(plainText: string): string {
  if (!KEY) {
    console.warn('[crypto] ENCRYPTION_KEY가 설정되지 않아 평문을 반환합니다.');
    return plainText;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return `${VERSION}:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(cipherText: string): string {
  if (!KEY) {
    return cipherText;
  }
  const parts = cipherText.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) return cipherText;
  const [, ivHex, tagHex, encryptedHex] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
}
