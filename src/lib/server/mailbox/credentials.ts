import { decryptSecret, encryptSecret } from '$lib/server/crypto/secret-encryption';

export function encryptMailboxPassword(password: string): string {
	return encryptSecret(password);
}

export function decryptMailboxPassword(passwordEncrypted: string): string {
	return decryptSecret(passwordEncrypted);
}
