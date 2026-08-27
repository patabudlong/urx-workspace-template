import { getTwilioConfig } from '$lib/server/sms/config';

export type { TwilioConfig } from '$lib/server/sms/config';

export function isWorkspaceSmsConfigured(): boolean {
	return getTwilioConfig() !== null;
}

export { getTwilioConfig };
