import { getSmsPittConfig, getSmsProvider, getTwilioConfig } from '$lib/server/sms/config';
import { createLogSmsTransport } from '$lib/server/sms/transports/log';
import { createSmsPittTransport } from '$lib/server/sms/transports/smspitt';
import { createTwilioTransport } from '$lib/server/sms/transports/twilio';
import type { SmsMessage, SmsTransport } from '$lib/server/sms/types';

let transportPromise: Promise<SmsTransport | null> | null = null;

function createTransport(): SmsTransport | null {
	const provider = getSmsProvider();

	if (provider === 'twilio') {
		const config = getTwilioConfig();
		return config ? createTwilioTransport(config) : null;
	}

	if (provider === 'smspitt') {
		const config = getSmsPittConfig();
		return config ? createSmsPittTransport(config) : null;
	}

	if (provider === 'log') {
		return createLogSmsTransport();
	}

	return null;
}

async function getTransport(): Promise<SmsTransport | null> {
	if (transportPromise) {
		const existing = await transportPromise;
		if (existing) {
			return existing;
		}
		transportPromise = null;
	}

	const transport = createTransport();

	if (transport) {
		transportPromise = Promise.resolve(transport);
	}

	return transport;
}

export async function sendSms(message: SmsMessage): Promise<void> {
	const transport = await getTransport();

	if (!transport) {
		throw new Error('SMS transport is not configured');
	}

	await transport.send(message);
}

export async function isSmsConfigured(): Promise<boolean> {
	return (await getTransport()) !== null;
}

export { getTwilioConfig } from '$lib/server/sms/config';
export { sendTwilioSms } from '$lib/server/sms/twilio';
