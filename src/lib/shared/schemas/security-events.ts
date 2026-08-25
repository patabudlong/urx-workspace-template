import { z } from 'zod';
import {
	SECURITY_EVENT_CATEGORIES,
	SECURITY_EVENT_SCOPES
} from '$lib/shared/models/security-event';

export const securityEventsQuerySchema = z.object({
	scope: z.enum([SECURITY_EVENT_SCOPES.ACCOUNT, SECURITY_EVENT_SCOPES.WORKSPACE]).default(
		SECURITY_EVENT_SCOPES.ACCOUNT
	),
	category: z
		.enum([
			SECURITY_EVENT_CATEGORIES.AUTH,
			SECURITY_EVENT_CATEGORIES.ACCOUNT,
			SECURITY_EVENT_CATEGORIES.WORKSPACE,
			SECURITY_EVENT_CATEGORIES.PLATFORM
		])
		.optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	unusualOnly: z
		.enum(['true', 'false'])
		.optional()
		.transform((value) => value === 'true')
});

export type SecurityEventsQuery = z.infer<typeof securityEventsQuerySchema>;
