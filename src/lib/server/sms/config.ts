import { env } from '$env/dynamic/private';

export type SmsProvider = 'smspitt' | 'log' | 'twilio';

export type TwilioConfig = {
	accountSid: string;
	apiKeySid: string;
	apiKeySecret: string;
	from?: string;
	messagingServiceSid?: string;
};

export function getTwilioConfig(): TwilioConfig | null {
	const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
	const apiKeySid = env.TWILIO_API_KEY_SID?.trim();
	const apiKeySecret = env.TWILIO_API_KEY_SECRET?.trim();
	const messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID?.trim();
	const from = env.TWILIO_FROM?.trim() || env.SMS_FROM?.trim();

	if (!accountSid || !apiKeySid || !apiKeySecret) {
		return null;
	}

	if (!messagingServiceSid && !from) {
		return null;
	}

	return {
		accountSid,
		apiKeySid,
		apiKeySecret,
		...(messagingServiceSid ? { messagingServiceSid } : {}),
		...(from ? { from } : {})
	};
}

export function getSmsProvider(): SmsProvider | null {
	const configured = env.SMS_PROVIDER?.trim().toLowerCase();

	if (configured === 'smspitt' || configured === 'log' || configured === 'twilio') {
		return configured;
	}

	if (getTwilioConfig()) {
		return 'twilio';
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
