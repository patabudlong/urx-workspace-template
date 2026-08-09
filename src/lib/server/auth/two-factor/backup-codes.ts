import { createHash, randomBytes } from 'node:crypto';
import { BACKUP_CODE_COUNT } from '$lib/shared/models/two-factor';

function hashBackupCode(code: string): string {
	return createHash('sha256').update(code).digest('hex');
}

function formatBackupCode(bytes: Buffer): string {
	const raw = bytes.toString('hex').slice(0, 8).toUpperCase();
	return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export function generateBackupCodes(): { codes: string[]; hashes: string[] } {
	const codes: string[] = [];
	const hashes: string[] = [];

	for (let index = 0; index < BACKUP_CODE_COUNT; index += 1) {
		const code = formatBackupCode(randomBytes(4));
		codes.push(code);
		hashes.push(hashBackupCode(code));
	}

	return { codes, hashes };
}

export function looksLikeBackupCode(code: string): boolean {
	const normalized = code.trim().toUpperCase().replace(/\s+/g, '');

	return normalized.includes('-') || normalized.length !== 6 || /[A-F]/.test(normalized);
}

export function verifyBackupCode(code: string, hashes: string[]): boolean {
	const normalized = code.trim().toUpperCase().replace(/\s+/g, '');
	const hash = hashBackupCode(normalized);

	return hashes.includes(hash);
}

export function removeUsedBackupCodeHash(hashes: string[], code: string): string[] {
	const normalized = code.trim().toUpperCase().replace(/\s+/g, '');
	const hash = hashBackupCode(normalized);

	return hashes.filter((entry) => entry !== hash);
}
