import { message, type SuperValidated } from 'sveltekit-superforms';
import { createAuthRateLimitMessage } from '$lib/shared/auth-messages';
import { consumeAuthRateLimit } from '$lib/server/security/auth-rate-limit';

export function getAuthRateLimitFormFailure<T extends Record<string, unknown>>(
	form: SuperValidated<T>,
	input: { clientIp: string; pathname: string }
) {
	const rateLimit = consumeAuthRateLimit(input);

	if (!rateLimit.ok) {
		return message(form, createAuthRateLimitMessage(rateLimit.retryAfterSeconds), { status: 429 });
	}

	return null;
}
