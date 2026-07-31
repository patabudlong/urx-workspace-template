import type { MailMessage, MailTransport } from '$lib/server/mail/types';

const POSTMARK_API_URL = 'https://api.postmarkapp.com/email';

export function createPostmarkTransport(config: {
	serverToken: string;
	from: string;
}): MailTransport {
	return {
		async send(message: MailMessage) {
			const response = await fetch(POSTMARK_API_URL, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					'X-Postmark-Server-Token': config.serverToken
				},
				body: JSON.stringify({
					From: config.from,
					To: message.to,
					Subject: message.subject,
					TextBody: message.text,
					HtmlBody: message.html,
					MessageStream: 'outbound',
					Attachments: message.attachments?.map((attachment) => ({
						Name: attachment.filename,
						Content: attachment.content.toString('base64'),
						ContentType: attachment.contentType,
						ContentID: `cid:${attachment.cid}`
					}))
				})
			});

			if (!response.ok) {
				const body = await response.text();
				throw new Error(`Postmark send failed (${response.status}): ${body}`);
			}
		}
	};
}
