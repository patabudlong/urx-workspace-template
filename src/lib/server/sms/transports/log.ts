import type { SmsMessage, SmsTransport } from '$lib/server/sms/types';

export function createLogSmsTransport(): SmsTransport {
	return {
		async send(message: SmsMessage): Promise<void> {
			console.info('[sms:log]', {
				to: message.to,
				body: message.body
			});
		}
	};
}
