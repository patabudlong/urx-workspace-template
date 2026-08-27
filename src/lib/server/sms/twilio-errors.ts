export class TwilioSmsError extends Error {
	readonly code?: number;

	constructor(message: string, code?: number) {
		super(message);
		this.name = 'TwilioSmsError';
		this.code = code;
	}
}

export function formatTwilioSmsErrorMessage(error: unknown): string {
	if (!(error instanceof TwilioSmsError)) {
		return error instanceof Error ? error.message : 'Failed to send SMS';
	}

	const hint = twilioErrorHint(error.code);
	if (hint) {
		return `${error.message} ${hint}`;
	}

	return error.message;
}

function twilioErrorHint(code: number | undefined): string | null {
	switch (code) {
		case 21612:
			return (
				'Twilio cannot route SMS from your sender to this country. ' +
				'Enable Philippines under Messaging → Geo permissions, verify the destination on trial accounts, ' +
				'or use a Messaging Service / Philippines-capable sender instead of a US number.'
			);
		case 21606:
			return (
				'Your From number is not SMS-capable on this Twilio account, or it belongs to a different account than your API key.'
			);
		case 21408:
			return 'Your Twilio account does not have permission to send SMS to this country. Enable it under Messaging → Geo permissions.';
		case 21211:
			return 'The destination number is not valid E.164.';
		default:
			return null;
	}
}
