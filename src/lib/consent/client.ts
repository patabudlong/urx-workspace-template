import { LEGAL_POLICY_VERSION } from '$lib/shared/legal';
import type { ConsentContext, ConsentEventType } from '$lib/shared/models/consent-event';

type RecordConsentOptions = {
	type: ConsentEventType;
	context: ConsentContext;
	email?: string;
};

/** Fire-and-forget consent logging for checkbox and social-login interactions. */
export function recordConsentEvent(options: RecordConsentOptions): void {
	void fetch('/api/v1/auth/consent', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			type: options.type,
			context: options.context,
			policyVersion: LEGAL_POLICY_VERSION,
			email: options.email
		})
	}).catch(() => {
		// Consent logging must not block the auth UX.
	});
}
