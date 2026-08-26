import { z } from 'zod';
import { NOTIFICATION_CATEGORIES } from '$lib/shared/models/notification';

export const notificationsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	unreadOnly: z
		.enum(['true', 'false'])
		.optional()
		.transform((value) => value === 'true'),
	category: z
		.enum([
			NOTIFICATION_CATEGORIES.SECURITY,
			NOTIFICATION_CATEGORIES.TEAM,
			NOTIFICATION_CATEGORIES.SYSTEM
		])
		.optional(),
	workspaceId: z.string().trim().min(1).optional()
});

export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>;

export const notificationsReadAllSchema = z.object({
	workspaceId: z.string().trim().min(1).optional()
});

export type NotificationsReadAllInput = z.infer<typeof notificationsReadAllSchema>;
