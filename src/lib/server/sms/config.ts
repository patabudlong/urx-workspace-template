import { env } from '$env/dynamic/private';

export type SmsProvider = 'smspitt' | 'log';

export function getSmsProvider(): SmsProvider | null {
	const configured = env.SMS_PROVIDER?.trim().toLowerCase();

	if (configured === 'smspitt' || configured === 'log') {
		return configured;
	}

	if (env.SMSPITT_URL?.trim()) {
		return 'smspitt';
	}

	if (process.env.NODE_ENV !== 'production') {
		return 'log';
	}

	return null;
}

export function getSmsPittConfig(): { baseUrl: string; from: string } | null {
	const baseUrl = env.SMSPITT_URL?.trim();

	if (!baseUrl) {
		return null;
	}

	return {
		baseUrl,
		from: env.SMS_FROM?.trim() || 'URX-WORKSPACE'
	};
}
