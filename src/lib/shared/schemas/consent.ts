import { z } from 'zod';
import { CONSENT_CONTEXTS, CONSENT_EVENT_TYPES } from '$lib/shared/models/consent-event';
import { LEGAL_POLICY_VERSION } from '$lib/shared/legal';

const consentEventTypeSchema = z.enum([
	CONSENT_EVENT_TYPES.TERMS_CHECKBOX,
	CONSENT_EVENT_TYPES.TERMS_SUBMIT,
	CONSENT_EVENT_TYPES.SOCIAL_LOGIN_GOOGLE,
	CONSENT_EVENT_TYPES.SOCIAL_LOGIN_APPLE,
	CONSENT_EVENT_TYPES.SOCIAL_LOGIN_FACEBOOK
]);

const consentContextSchema = z.enum([CONSENT_CONTEXTS.SIGNUP, CONSENT_CONTEXTS.LOGIN]);

export const recordConsentSchema = z.object({
	type: consentEventTypeSchema,
	context: consentContextSchema,
	policyVersion: z.literal(LEGAL_POLICY_VERSION),
	email: z.email().optional()
});

export type RecordConsentInput = z.infer<typeof recordConsentSchema>;
