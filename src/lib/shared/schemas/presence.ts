import { z } from 'zod';
import { PRESENCE_STATUS_OPTIONS } from '$lib/shared/presence';

export const updatePresenceStatusSchema = z.object({
	status: z.enum(PRESENCE_STATUS_OPTIONS)
});

export type UpdatePresenceStatusInput = z.infer<typeof updatePresenceStatusSchema>;
