import { z } from 'zod';

export const acceptInvitationSchema = z.object({
	token: z.string().trim().min(1, 'Invitation link is invalid.')
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
