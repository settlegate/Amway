import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_HEX = process.env.ENCRYPTION_KEY || '';

let KEY: Buffer | null = null;
if (KEY_HEX.length === 64) {
  KEY = Buffer.from(KEY_HEX, 'hex');
}

export function encrypt(plainText: string): string {
  if (!KEY) {
    console.warn('[crypto] ENCRYPTION_KEY가 설정되지 않아 평문을 반환합니다.');
    return plainText;
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(cipherText: string): string {
  if (!KEY) {
    return cipherText;
  }
  const [ivHex, encryptedHex] = cipherText.split(':');
  if (!ivHex || !encryptedHex) return cipherText;
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
