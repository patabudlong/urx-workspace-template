import { z } from 'zod';
import {
	DEFAULT_TEAM_INVITE_ROLE,
	TEAM_INVITE_ROLE_VALUES
} from '$lib/shared/team/invite-roles';

export const teamInvitationSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, 'Email is required.')
		.email('Enter a valid email address.'),
	role: z.enum(TEAM_INVITE_ROLE_VALUES)
});

export type TeamInvitationInput = z.infer<typeof teamInvitationSchema>;

export const teamInvitationDefaults: TeamInvitationInput = {
	email: '',
	role: DEFAULT_TEAM_INVITE_ROLE
};

export const cancelTeamInvitationSchema = z.object({
	invitationId: z.string().trim().min(1, 'Invitation is required.')
});

export type CancelTeamInvitationInput = z.infer<typeof cancelTeamInvitationSchema>;

export const removeTeamMemberSchema = z.object({
	memberId: z.string().trim().min(1, 'Member is required.')
});

export type RemoveTeamMemberInput = z.infer<typeof removeTeamMemberSchema>;
