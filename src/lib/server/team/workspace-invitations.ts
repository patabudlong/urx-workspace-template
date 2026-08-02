import { createHash, randomBytes } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { sendTeamInvitationEmail } from '$lib/server/mail/team-invitation-email';
import { isMailConfigured } from '$lib/server/mail/index';
import { buildPlatformWorkspaceUrl } from '$lib/server/mail/platform-origin';
import {
	createWorkspaceInvitation,
	ensureWorkspaceInvitationIndexes,
	findPendingWorkspaceInvitation
} from '$lib/server/repositories/workspace-invitations';
import {
	ensureWorkspaceMemberIndexes,
	findWorkspaceMemberByWorkspaceAndUserId
} from '$lib/server/repositories/workspace-members';
import { findUserByEmail } from '$lib/server/repositories/users';
import { ensureWorkspaceIndexes, findWorkspaceById } from '$lib/server/repositories/workspaces';
import {
	consumeTeamInvitationSend,
	isTeamInvitationEmailThrottled,
	isTeamInvitationWorkspaceThrottled
} from '$lib/server/security/team-invitation-rate-limit';
import type { TeamInvitationInput } from '$lib/shared/schemas/team-invitation';
import {
	TEAM_INVITATION_ALREADY_MEMBER_MESSAGE,
	TEAM_INVITATION_DUPLICATE_PENDING_MESSAGE,
	TEAM_INVITATION_SELF_MESSAGE
} from '$lib/shared/team/invitation-messages';

const TOKEN_BYTES = 16;
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type TeamInvitationEmailPayload = {
	to: string;
	inviterName: string;
	workspaceName: string;
	role: TeamInvitationInput['role'];
	acceptUrl: string;
	origin: string;
};

export type PrepareTeamInvitationResult =
	| { ok: true; status: 'send_pending'; payload: TeamInvitationEmailPayload }
	| { ok: true; status: 'duplicate_pending' }
	| { ok: true; status: 'already_member' }
	| { ok: true; status: 'self_invite' }
	| { ok: true; status: 'throttled' }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' }
	| { ok: false; reason: 'WORKSPACE_NOT_FOUND' };

function hashInvitationToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

function createRawInvitationToken(): string {
	return randomBytes(TOKEN_BYTES).toString('base64url');
}

export async function prepareTeamInvitation(input: {
	workspaceId: string;
	invitedByUserId: string;
	inviterName: string;
	inviterEmail: string;
	data: TeamInvitationInput;
	origin: string;
}): Promise<PrepareTeamInvitationResult> {
	await Promise.all([
		ensureWorkspaceIndexes(),
		ensureWorkspaceMemberIndexes(),
		ensureWorkspaceInvitationIndexes()
	]);

	if (!(await isMailConfigured())) {
		return { ok: false, reason: 'MAIL_NOT_CONFIGURED' };
	}

	const workspace = await findWorkspaceById(input.workspaceId);

	if (!workspace) {
		return { ok: false, reason: 'WORKSPACE_NOT_FOUND' };
	}

	const invitedEmail = input.data.email.trim().toLowerCase();
	const inviterEmail = input.inviterEmail.trim().toLowerCase();

	if (invitedEmail === inviterEmail) {
		return { ok: true, status: 'self_invite' };
	}

	if (
		isTeamInvitationWorkspaceThrottled(input.workspaceId) ||
		isTeamInvitationEmailThrottled(invitedEmail)
	) {
		return { ok: true, status: 'throttled' };
	}

	const existingPending = await findPendingWorkspaceInvitation({
		workspaceId: input.workspaceId,
		invitedEmail
	});

	if (existingPending) {
		return { ok: true, status: 'duplicate_pending' };
	}

	const existingUser = await findUserByEmail(invitedEmail);

	if (existingUser) {
		const membership = await findWorkspaceMemberByWorkspaceAndUserId({
			workspaceId: input.workspaceId,
			userId: existingUser._id.toString()
		});

		if (membership) {
			return { ok: true, status: 'already_member' };
		}
	}

	const rawToken = createRawInvitationToken();
	const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

	await createWorkspaceInvitation({
		workspaceId: input.workspaceId,
		invitedEmail,
		role: input.data.role,
		tokenHash: hashInvitationToken(rawToken),
		invitedByUserId: input.invitedByUserId,
		expiresAt
	});

	if (
		!consumeTeamInvitationSend({
			workspaceId: input.workspaceId,
			email: invitedEmail
		})
	) {
		return { ok: true, status: 'throttled' };
	}

	const acceptUrl = `${buildPlatformWorkspaceUrl(input.origin, '/accept-invitation')}?token=${encodeURIComponent(rawToken)}`;

	return {
		ok: true,
		status: 'send_pending',
		payload: {
			to: invitedEmail,
			inviterName: input.inviterName,
			workspaceName: workspace.name,
			role: input.data.role,
			acceptUrl,
			origin: input.origin
		}
	};
}

export async function sendPreparedTeamInvitationEmail(
	payload: TeamInvitationEmailPayload
): Promise<{ ok: true } | { ok: false; reason: 'SEND_FAILED' }> {
	try {
		await sendTeamInvitationEmail(payload);
	} catch (error) {
		console.error('Failed to send team invitation email', error);
		return { ok: false, reason: 'SEND_FAILED' };
	}

	return { ok: true };
}

export async function queueTeamInvitationForWeb(
	_event: Pick<RequestEvent, 'platform'>,
	input: {
		workspaceId: string;
		invitedByUserId: string;
		inviterName: string;
		inviterEmail: string;
		data: TeamInvitationInput;
		origin: string;
	}
): Promise<
	| { ok: true }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' }
	| { ok: false; reason: 'WORKSPACE_NOT_FOUND' }
	| { ok: false; reason: 'SEND_FAILED' }
	| { ok: false; reason: 'THROTTLED' }
	| { ok: false; reason: 'DUPLICATE_PENDING'; message: string }
	| { ok: false; reason: 'ALREADY_MEMBER'; message: string }
	| { ok: false; reason: 'SELF_INVITE'; message: string }
> {
	const prepared = await prepareTeamInvitation(input);

	if (!prepared.ok) {
		return prepared;
	}

	if (prepared.status === 'throttled') {
		return { ok: false, reason: 'THROTTLED' };
	}

	if (prepared.status === 'duplicate_pending') {
		return {
			ok: false,
			reason: 'DUPLICATE_PENDING',
			message: TEAM_INVITATION_DUPLICATE_PENDING_MESSAGE
		};
	}

	if (prepared.status === 'already_member') {
		return {
			ok: false,
			reason: 'ALREADY_MEMBER',
			message: TEAM_INVITATION_ALREADY_MEMBER_MESSAGE
		};
	}

	if (prepared.status === 'self_invite') {
		return {
			ok: false,
			reason: 'SELF_INVITE',
			message: TEAM_INVITATION_SELF_MESSAGE
		};
	}

	const sent = await sendPreparedTeamInvitationEmail(prepared.payload);

	if (!sent.ok) {
		return sent;
	}

	return { ok: true };
}
