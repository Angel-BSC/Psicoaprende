import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
export const hashToken = (value) => createHash('sha256').update(value).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, options);
  return `scrypt$131072$8$1$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const key = await derive(password, parts[4], 64, options);
  const expected = Buffer.from(parts[5], 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}
