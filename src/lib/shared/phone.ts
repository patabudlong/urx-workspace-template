export function normalizePhoneNumber(input: string): string {
	const trimmed = input.trim();

	if (!trimmed) {
		return '';
	}

	let cleaned = trimmed.replace(/[\s().-]/g, '');

	if (cleaned.startsWith('00')) {
		cleaned = `+${cleaned.slice(2)}`;
	}

	return cleaned;
}

export function isE164PhoneNumber(value: string): boolean {
	return /^\+[1-9]\d{7,14}$/.test(value);
}
