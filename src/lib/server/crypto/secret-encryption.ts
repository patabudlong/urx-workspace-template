import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { getJwtSigningSecret } from '$lib/server/auth/session';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function deriveKey(): Buffer {
	return createHash('sha256').update(getJwtSigningSecret()).digest();
}

export function encryptSecret(plaintext: string): string {
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, deriveKey(), iv);
	const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();

	return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(encryptedValue: string): string {
	const buffer = Buffer.from(encryptedValue, 'base64');
	const iv = buffer.subarray(0, IV_LENGTH);
	const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
	const data = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
	const decipher = createDecipheriv(ALGORITHM, deriveKey(), iv);
	decipher.setAuthTag(tag);

	return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
