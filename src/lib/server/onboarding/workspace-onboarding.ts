import { findUserById } from '$lib/server/repositories/users';
import {
	findPendingWorkspaceByUserId,
	findWorkspaceByName,
	findWorkspaceBySlug,
	findWorkspaceBySlugOrId
} from '$lib/server/repositories/workspaces';
import { findWorkspaceMemberByUserId, createWorkspaceMember } from '$lib/server/repositories/workspace-members';
import { ensureWorkspaceIndexes } from '$lib/server/repositories/workspaces';
import { ensureWorkspaceMemberIndexes } from '$lib/server/repositories/workspace-members';
import { sendWorkspaceRequestReceivedEmail } from '$lib/server/mail/workspace-request-received';
import { sendWorkspaceRequestTeamEmail } from '$lib/server/mail/workspace-request-team';
import { isMailConfigured } from '$lib/server/mail/index';
import { getWorkspaceReviewTeamEmail } from '$lib/server/auth/platform-admin';
import type { OwnerOnboardingInput, MemberOnboardingInput } from '$lib/shared/schemas/onboarding';
import { WORKSPACE_STATUSES } from '$lib/shared/models/workspace';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
import { createWorkspaceRequest } from '$lib/server/repositories/workspaces';

export type OnboardingAccessState =
	| { status: 'needs_onboarding' }
	| { status: 'pending_review'; workspaceName: string; workspaceSlug: string }
	| { status: 'ready'; workspaceId: string; workspaceName: string; workspaceSlug: string; role: string };

export async function getOnboardingAccessState(userId: string): Promise<OnboardingAccessState> {
	await ensureWorkspaceMemberIndexes();
	await ensureWorkspaceIndexes();

	const membership = await findWorkspaceMemberByUserId(userId);

	if (membership) {
		const workspace = await findWorkspaceBySlugOrId(membership.workspaceId.toString());

		return {
			status: 'ready',
			workspaceId: membership.workspaceId.toString(),
			workspaceName: workspace?.name ?? 'Workspace',
			workspaceSlug: workspace?.slug ?? '',
			role: membership.role
		};
	}

	const pending = await findPendingWorkspaceByUserId(userId);

	if (pending) {
		return {
			status: 'pending_review',
			workspaceName: pending.name,
			workspaceSlug: pending.slug
		};
	}

	return { status: 'needs_onboarding' };
}

export async function submitOwnerWorkspaceRequest(input: {
	userId: string;
	origin: string;
	data: OwnerOnboardingInput;
}): Promise<
	| { ok: true; workspaceSlug: string }
	| {
			ok: false;
			reason:
				| 'ALREADY_HAS_WORKSPACE'
				| 'PENDING_REQUEST_EXISTS'
				| 'NAME_TAKEN'
				| 'SLUG_TAKEN'
				| 'MAIL_NOT_CONFIGURED'
				| 'TEAM_EMAIL_NOT_CONFIGURED';
	  }
> {
	const access = await getOnboardingAccessState(input.userId);

	if (access.status === 'ready') {
		return { ok: false, reason: 'ALREADY_HAS_WORKSPACE' };
	}

	if (access.status === 'pending_review') {
		return { ok: false, reason: 'PENDING_REQUEST_EXISTS' };
	}

	const existingName = await findWorkspaceByName(input.data.name);

	if (existingName) {
		return { ok: false, reason: 'NAME_TAKEN' };
	}

	const existingSlug = await findWorkspaceBySlug(input.data.slug);

	if (existingSlug) {
		return { ok: false, reason: 'SLUG_TAKEN' };
	}

	const teamEmail = getWorkspaceReviewTeamEmail();

	if (!teamEmail) {
		return { ok: false, reason: 'TEAM_EMAIL_NOT_CONFIGURED' };
	}

	if (!(await isMailConfigured())) {
		return { ok: false, reason: 'MAIL_NOT_CONFIGURED' };
	}

	const user = await findUserById(input.userId);

	if (!user) {
		return { ok: false, reason: 'ALREADY_HAS_WORKSPACE' };
	}

	const workspace = await createWorkspaceRequest({
		slug: input.data.slug,
		name: input.data.name,
		contactPhone: input.data.contactPhone,
		teamSize: input.data.teamSize,
		website: input.data.website,
		requestedByUserId: input.userId,
		address: {
			line1: input.data.addressLine1,
			line2: input.data.addressLine2 || undefined,
			city: input.data.city,
			region: input.data.region || undefined,
			postalCode: input.data.postalCode || undefined,
			country: input.data.country
		}
	});

	await Promise.all([
		sendWorkspaceRequestReceivedEmail({
			to: user.email,
			firstName: user.firstName,
			workspaceName: workspace.name,
			origin: input.origin
		}),
		sendWorkspaceRequestTeamEmail({
			to: teamEmail,
			requesterName: `${user.firstName} ${user.lastName}`.trim(),
			requesterEmail: user.email,
			workspaceName: workspace.name,
			workspaceSlug: workspace.slug,
			teamSize: workspace.teamSize,
			contactPhone: workspace.contactPhone,
			country: workspace.address.country,
			origin: input.origin
		})
	]);

	return { ok: true, workspaceSlug: workspace.slug };
}

export async function joinWorkspaceAsMember(input: {
	userId: string;
	data: MemberOnboardingInput;
}): Promise<
	| { ok: true; workspaceSlug: string; workspaceName: string }
	| {
			ok: false;
			reason:
				| 'ALREADY_HAS_WORKSPACE'
				| 'PENDING_REQUEST_EXISTS'
				| 'WORKSPACE_NOT_FOUND'
				| 'WORKSPACE_NOT_ACTIVE';
	  }
> {
	const access = await getOnboardingAccessState(input.userId);

	if (access.status === 'ready') {
		return { ok: false, reason: 'ALREADY_HAS_WORKSPACE' };
	}

	if (access.status === 'pending_review') {
		return { ok: false, reason: 'PENDING_REQUEST_EXISTS' };
	}

	const workspace = await findWorkspaceBySlugOrId(input.data.workspaceRef);

	if (!workspace) {
		return { ok: false, reason: 'WORKSPACE_NOT_FOUND' };
	}

	if (workspace.status !== WORKSPACE_STATUSES.ACTIVE) {
		return { ok: false, reason: 'WORKSPACE_NOT_ACTIVE' };
	}

	await createWorkspaceMember({
		userId: input.userId,
		workspaceId: workspace._id.toString(),
		role: WORKSPACE_MEMBER_ROLES.MEMBER
	});

	return {
		ok: true,
		workspaceSlug: workspace.slug,
		workspaceName: workspace.name
	};
}
