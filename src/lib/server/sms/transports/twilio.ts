import type { TwilioConfig } from '$lib/server/sms/config';
import { sendTwilioSms } from '$lib/server/sms/twilio';
import type { SmsMessage, SmsTransport } from '$lib/server/sms/types';

export function createTwilioTransport(config: TwilioConfig): SmsTransport {
	return {
		async send(message: SmsMessage): Promise<void> {
			await sendTwilioSms(config, message);
		}
	};
}
