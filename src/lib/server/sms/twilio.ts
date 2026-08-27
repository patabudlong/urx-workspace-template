import type { TwilioConfig } from '$lib/server/sms/config';
import { TwilioSmsError } from '$lib/server/sms/twilio-errors';

type TwilioSendResult = {
	providerMessageId: string;
};

type TwilioErrorResponse = {
	message?: string;
	code?: number;
};

export async function sendTwilioSms(
	config: TwilioConfig,
	input: { to: string; body: string }
): Promise<TwilioSendResult> {
	const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`;
	const auth = Buffer.from(`${config.apiKeySid}:${config.apiKeySecret}`).toString('base64');
	const body = new URLSearchParams({
		To: input.to,
		Body: input.body
	});

	if (config.messagingServiceSid) {
		body.set('MessagingServiceSid', config.messagingServiceSid);
	} else if (config.from) {
		body.set('From', config.from);
	} else {
		throw new TwilioSmsError('Twilio sender is not configured. Set TWILIO_FROM or TWILIO_MESSAGING_SERVICE_SID.');
	}

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body
	});

	const payload = (await response.json().catch(() => ({}))) as {
		sid?: string;
		message?: string;
		code?: number;
	};

	if (!response.ok) {
		const error = payload as TwilioErrorResponse;
		throw new TwilioSmsError(
			error.message ?? `Twilio request failed (${response.status})`,
			error.code
		);
	}

	if (!payload.sid) {
		throw new TwilioSmsError('Twilio response did not include a message SID');
	}

	return { providerMessageId: payload.sid };
}
