export type PhoneCountryCode = {
	iso: string;
	name: string;
	dialCode: string;
};

export function countryFlag(iso: string): string {
	const code = iso.toUpperCase();
	if (code.length !== 2) {
		return '🌐';
	}

	return String.fromCodePoint(...[...code].map((char) => 127397 + char.charCodeAt(0)));
}

export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
	{ iso: 'AU', name: 'Australia', dialCode: '+61' },
	{ iso: 'CA', name: 'Canada', dialCode: '+1' },
	{ iso: 'DE', name: 'Germany', dialCode: '+49' },
	{ iso: 'IN', name: 'India', dialCode: '+91' },
	{ iso: 'IE', name: 'Ireland', dialCode: '+353' },
	{ iso: 'JP', name: 'Japan', dialCode: '+81' },
	{ iso: 'NZ', name: 'New Zealand', dialCode: '+64' },
	{ iso: 'PH', name: 'Philippines', dialCode: '+63' },
	{ iso: 'SG', name: 'Singapore', dialCode: '+65' },
	{ iso: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
	{ iso: 'GB', name: 'United Kingdom', dialCode: '+44' },
	{ iso: 'US', name: 'United States', dialCode: '+1' }
];

const dialCodesByLength = [...PHONE_COUNTRY_CODES].sort(
	(a, b) => b.dialCode.length - a.dialCode.length
);

export function parseContactPhone(full: string): { iso: string; national: string } {
	const trimmed = full.trim();

	if (!trimmed) {
		return { iso: 'AU', national: '' };
	}

	for (const entry of dialCodesByLength) {
		if (trimmed.startsWith(entry.dialCode)) {
			return {
				iso: entry.iso,
				national: trimmed.slice(entry.dialCode.length).trim()
			};
		}
	}

	return { iso: 'AU', national: trimmed.replace(/^\+/, '') };
}

export function dialCodeForIso(iso: string): string {
	return PHONE_COUNTRY_CODES.find((entry) => entry.iso === iso)?.dialCode ?? '+61';
}

export function formatContactPhone(iso: string, national: string): string {
	const digits = national.trim();

	if (!digits) {
		return '';
	}

	return `${dialCodeForIso(iso)} ${digits}`;
}
