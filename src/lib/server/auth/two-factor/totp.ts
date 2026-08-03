import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { decryptSecret, encryptSecret } from '$lib/server/crypto/secret-encryption';

const TOTP_ISSUER = 'Urixoft Workspace';

export function createTotpSecret(): string {
	return generateSecret();
}

export function encryptTotpSecret(secret: string): string {
	return encryptSecret(secret);
}

export function decryptTotpSecret(secretEncrypted: string): string {
	return decryptSecret(secretEncrypted);
}

export function buildTotpUri(input: { email: string; secret: string }): string {
	return generateURI({
		issuer: TOTP_ISSUER,
		label: input.email,
		secret: input.secret
	});
}

export async function createTotpQrDataUrl(otpauthUri: string): Promise<string> {
	return QRCode.toDataURL(otpauthUri, {
		margin: 1,
		width: 200
	});
}

export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
	const result = await verify({ secret, token: code.trim() });

	return result.valid;
}
