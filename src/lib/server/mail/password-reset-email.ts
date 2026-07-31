import { sendMail } from '$lib/server/mail/index';

export async function sendPasswordResetEmail(input: {
	to: string;
	firstName: string;
	resetUrl: string;
}): Promise<void> {
	const greeting = input.firstName.trim() || 'there';

	await sendMail({
		to: input.to,
		subject: 'Reset your Urixoft Workspace password',
		text: [
			`Hi ${greeting},`,
			'',
			'We received a request to reset your password.',
			`Reset your password: ${input.resetUrl}`,
			'',
			'This link expires in 1 hour. If you did not request a reset, you can ignore this email.',
			'',
			'— Urixoft Workspace'
		].join('\n'),
		html: [
			`<p>Hi ${escapeHtml(greeting)},</p>`,
			'<p>We received a request to reset your password.</p>',
			`<p><a href="${escapeHtml(input.resetUrl)}">Reset your password</a></p>`,
			'<p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>',
			'<p>— Urixoft Workspace</p>'
		].join('')
	});
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
