import type { SmsMessage, SmsTransport } from '$lib/server/sms/types';

export function createSmsPittTransport(config: { baseUrl: string; from: string }): SmsTransport {
	const baseUrl = config.baseUrl.replace(/\/$/, '');

	return {
		async send(message: SmsMessage): Promise<void> {
			const response = await fetch(`${baseUrl}/generic`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					to: message.to,
					from: config.from,
					message: message.body
				})
			});

			if (!response.ok) {
				const body = await response.text().catch(() => '');
				throw new Error(`SMSPit request failed (${response.status}): ${body}`);
			}
		}
	};
}
