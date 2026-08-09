import { createHash, randomBytes } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { sendTeamInvitationEmail } from '$lib/server/mail/team-invitation-email';
import { isMailConfigured } from '$lib/server/mail/index';
import { buildPlatformWorkspaceUrl } from '$lib/server/mail/platform-origin';
import {
	createWorkspaceInvitation,
	declineWorkspaceInvitationByTokenHash,
	ensureWorkspaceInvitationIndexes,
	findPendingWorkspaceInvitation,
	findValidWorkspaceInvitationByTokenHash,
	findWorkspaceInvitationById,
	markWorkspaceInvitationAccepted,
	refreshWorkspaceInvitationToken
} from '$lib/server/repositories/workspace-invitations';
import {
	createWorkspaceMember,
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
import { WORKSPACE_STATUSES } from '$lib/shared/models/workspace';
import type { WorkspaceMemberRole } from '$lib/shared/models/workspace-member';
import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';
import {
	TEAM_INVITATION_ALREADY_MEMBER_MESSAGE,
	TEAM_INVITATION_DUPLICATE_PENDING_MESSAGE,
	TEAM_INVITATION_SELF_MESSAGE
} from '$lib/shared/team/invitation-messages';

const TOKEN_BYTES = 16;
import { INVITATION_TTL_MS } from '$lib/shared/team/invitation-ttl';

export type TeamInvitationEmailPayload = {
	to: string;
	inviterName: string;
	workspaceName: string;
	role: TeamInvitationInput['role'];
	acceptUrl: string;
	origin: string;
	expiresAt: Date;
	hasAccount: boolean;
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
	return createHash('sha256').update(token.trim()).digest('hex');
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

	if (
		!consumeTeamInvitationSend({
			workspaceId: input.workspaceId,
			email: invitedEmail
		})
	) {
		return { ok: true, status: 'throttled' };
	}

	await createWorkspaceInvitation({
		workspaceId: input.workspaceId,
		invitedEmail,
		role: input.data.role,
		tokenHash: hashInvitationToken(rawToken),
		invitedByUserId: input.invitedByUserId,
		expiresAt
	});

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
			origin: input.origin,
			expiresAt,
			hasAccount: Boolean(existingUser)
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
	| { ok: true; inviteeHasAccount: boolean }
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

	return { ok: true, inviteeHasAccount: prepared.payload.hasAccount };
}

export type WorkspaceInvitationPreview = {
	invitationId: string;
	workspaceId: string;
	workspaceName: string;
	workspaceSlug: string;
	invitedEmail: string;
	roleLabel: string;
	brandLogoUrl: string | null;
	expiresAt: string;
};

export async function getWorkspaceInvitationPreview(
	token: string
): Promise<WorkspaceInvitationPreview | null> {
	const normalizedToken = token.trim();

	if (!normalizedToken) {
		return null;
	}

	await ensureWorkspaceInvitationIndexes();

	const invitation = await findValidWorkspaceInvitationByTokenHash(
		hashInvitationToken(normalizedToken)
	);

	if (!invitation) {
		return null;
	}

	const workspace = await findWorkspaceById(invitation.workspaceId.toString());

	if (!workspace || workspace.status !== WORKSPACE_STATUSES.ACTIVE) {
		return null;
	}

	return {
		invitationId: invitation._id.toString(),
		workspaceId: invitation.workspaceId.toString(),
		workspaceName: workspace.name,
		workspaceSlug: workspace.slug,
		invitedEmail: invitation.invitedEmail,
		roleLabel: findTeamInviteRoleOption(invitation.role)?.label ?? invitation.role,
		brandLogoUrl: workspace.brandLogoUrl?.trim() || null,
		expiresAt: invitation.expiresAt.toISOString()
	};
}

export async function isWorkspaceInvitationTokenValid(token: string): Promise<boolean> {
	return (await getWorkspaceInvitationPreview(token)) !== null;
}

export async function acceptWorkspaceInvitation(input: {
	token: string;
	userId: string;
	userEmail: string;
}): Promise<
	| { ok: true; workspaceSlug: string }
	| { ok: false; reason: 'INVALID_TOKEN' }
	| { ok: false; reason: 'EMAIL_MISMATCH' }
	| { ok: false; reason: 'WORKSPACE_NOT_FOUND' }
> {
	await Promise.all([ensureWorkspaceInvitationIndexes(), ensureWorkspaceMemberIndexes()]);

	const invitation = await findValidWorkspaceInvitationByTokenHash(
		hashInvitationToken(input.token.trim())
	);

	if (!invitation) {
		return { ok: false, reason: 'INVALID_TOKEN' };
	}

	const invitedEmail = input.userEmail.trim().toLowerCase();

	if (invitedEmail !== invitation.invitedEmail) {
		return { ok: false, reason: 'EMAIL_MISMATCH' };
	}

	const workspace = await findWorkspaceById(invitation.workspaceId.toString());

	if (!workspace || workspace.status !== WORKSPACE_STATUSES.ACTIVE) {
		return { ok: false, reason: 'WORKSPACE_NOT_FOUND' };
	}

	const existingMembership = await findWorkspaceMemberByWorkspaceAndUserId({
		workspaceId: invitation.workspaceId.toString(),
		userId: input.userId
	});

	if (!existingMembership) {
		await createWorkspaceMember({
			userId: input.userId,
			workspaceId: invitation.workspaceId.toString(),
			role: invitation.role as WorkspaceMemberRole
		});
	}

	await markWorkspaceInvitationAccepted(invitation._id.toString());

	return { ok: true, workspaceSlug: workspace.slug };
}

export async function declineWorkspaceInvitation(
	token: string
): Promise<{ ok: true } | { ok: false; reason: 'INVALID_TOKEN' }> {
	const normalizedToken = token.trim();

	if (!normalizedToken) {
		return { ok: false, reason: 'INVALID_TOKEN' };
	}

	await ensureWorkspaceInvitationIndexes();

	const declined = await declineWorkspaceInvitationByTokenHash(
		hashInvitationToken(normalizedToken)
	);

	if (!declined) {
		return { ok: false, reason: 'INVALID_TOKEN' };
	}

	return { ok: true };
}

export async function resendWorkspaceInvitationForWeb(input: {
	workspaceId: string;
	invitationId: string;
	inviterName: string;
	origin: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'NOT_FOUND' }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' }
	| { ok: false; reason: 'SEND_FAILED' }
	| { ok: false; reason: 'WORKSPACE_NOT_FOUND' }
> {
	if (!(await isMailConfigured())) {
		return { ok: false, reason: 'MAIL_NOT_CONFIGURED' };
	}

	await ensureWorkspaceInvitationIndexes();

	const invitation = await findWorkspaceInvitationById({
		invitationId: input.invitationId,
		workspaceId: input.workspaceId
	});

	if (!invitation) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	const workspace = await findWorkspaceById(input.workspaceId);

	if (!workspace) {
		return { ok: false, reason: 'WORKSPACE_NOT_FOUND' };
	}

	const rawToken = createRawInvitationToken();
	const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

	const refreshed = await refreshWorkspaceInvitationToken({
		invitationId: input.invitationId,
		workspaceId: input.workspaceId,
		tokenHash: hashInvitationToken(rawToken),
		expiresAt
	});

	if (!refreshed) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	const acceptUrl = `${buildPlatformWorkspaceUrl(input.origin, '/accept-invitation')}?token=${encodeURIComponent(rawToken)}`;

	return sendPreparedTeamInvitationEmail({
		to: invitation.invitedEmail,
		inviterName: input.inviterName,
		workspaceName: workspace.name,
		role: invitation.role,
		acceptUrl,
		origin: input.origin,
		expiresAt,
		hasAccount: Boolean(await findUserByEmail(invitation.invitedEmail))
	});
}
