import { isMailConfigured } from '$lib/server/mail/index';
import { sendPmClientOnboardingEmail } from '$lib/server/mail/pm-client-onboarding-email';
import { buildPlatformWorkspaceUrl } from '$lib/server/mail/platform-origin';
import { getPmProjectForWorkspace, savePmProjectOnboarding } from '$lib/server/repositories/pm-projects';
import {
	createPmClientInvitation,
	createPmClientInvitationToken,
	ensurePmClientInvitationIndexes,
	findPmClientInvitationByTokenHash,
	hashPmClientInvitationToken,
	listPmClientInvitationsForProject,
	markPmClientInvitationCompleted
} from '$lib/server/repositories/pm-client-invitations';
import { findWorkspaceById } from '$lib/server/repositories/workspaces';
import type { PmClientInvitationDto } from '$lib/shared/models/pm-client-invitation';
import { PM_CLIENT_INVITATION_STATUSES } from '$lib/shared/models/pm-client-invitation';
import type { PmClientOnboardingPreview } from '$lib/shared/models/pm-project-onboarding';
import type { PmProjectOnboarding } from '$lib/shared/models/pm-project-onboarding';
import { PM_CLIENT_ONBOARDING_TTL_MS } from '$lib/shared/project-management/invitation-ttl';
import { pmProjectIncludesWebsite } from '$lib/shared/project-management/project-types';
import type { PmClientOnboardingFormInput } from '$lib/shared/project-management/schemas';

export type SendPmClientOnboardingInviteResult =
	| { ok: true; invitation: PmClientInvitationDto }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' | 'WORKSPACE_NOT_FOUND' | 'PROJECT_NOT_FOUND' };

export type SubmitPmClientOnboardingResult =
	| { ok: true }
	| {
			ok: false;
			reason: 'INVALID_TOKEN' | 'ALREADY_SUBMITTED' | 'EMAIL_MISMATCH' | 'PROJECT_NOT_FOUND';
	  };

function mapOnboardingInput(
	data: PmClientOnboardingFormInput,
	includeWebsiteFields: boolean
): PmProjectOnboarding {
	const now = new Date().toISOString();

	return {
		contactName: data.contactName,
		contactEmail: data.contactEmail.trim().toLowerCase(),
		businessName: data.businessName,
		projectGoals: data.projectGoals,
		pagesNeeded: data.pagesNeeded && data.pagesNeeded.length > 0 ? data.pagesNeeded : null,
		brandNotes: data.brandNotes && data.brandNotes.length > 0 ? data.brandNotes : null,
		domainStatus: includeWebsiteFields ? (data.domainStatus ?? null) : null,
		hostingPreference: includeWebsiteFields ? (data.hostingPreference ?? null) : null,
		additionalNotes:
			data.additionalNotes && data.additionalNotes.length > 0 ? data.additionalNotes : null,
		submittedAt: now
	};
}

export async function sendPmClientOnboardingInvite(input: {
	workspaceId: string;
	projectId: string;
	invitedByUserId: string;
	inviterName: string;
	clientEmail: string;
	clientName: string | null;
	origin: string;
}): Promise<SendPmClientOnboardingInviteResult> {
	await ensurePmClientInvitationIndexes();

	if (!(await isMailConfigured())) {
		return { ok: false, reason: 'MAIL_NOT_CONFIGURED' };
	}

	const [workspace, project] = await Promise.all([
		findWorkspaceById(input.workspaceId),
		getPmProjectForWorkspace({
			workspaceId: input.workspaceId,
			projectId: input.projectId
		})
	]);

	if (!workspace) {
		return { ok: false, reason: 'WORKSPACE_NOT_FOUND' };
	}

	if (!project) {
		return { ok: false, reason: 'PROJECT_NOT_FOUND' };
	}

	const rawToken = createPmClientInvitationToken();
	const tokenHash = hashPmClientInvitationToken(rawToken);
	const expiresAt = new Date(Date.now() + PM_CLIENT_ONBOARDING_TTL_MS);

	const invitation = await createPmClientInvitation({
		workspaceId: input.workspaceId,
		projectId: input.projectId,
		clientEmail: input.clientEmail,
		clientName: input.clientName,
		tokenHash,
		invitedByUserId: input.invitedByUserId,
		expiresAt
	});

	const onboardingUrl = buildPlatformWorkspaceUrl(
		input.origin,
		`/client/project-onboarding?token=${encodeURIComponent(rawToken)}`
	);

	await sendPmClientOnboardingEmail({
		to: input.clientEmail,
		inviterName: input.inviterName,
		workspaceName: workspace.name,
		projectTitle: project.title,
		onboardingUrl,
		origin: input.origin,
		expiresAt
	});

	return {
		ok: true,
		invitation: {
			id: invitation._id.toString(),
			workspaceId: invitation.workspaceId.toString(),
			projectId: invitation.projectId.toString(),
			clientEmail: invitation.clientEmail,
			clientName: invitation.clientName,
			status: invitation.status,
			expiresAt: invitation.expiresAt.toISOString(),
			completedAt: null,
			createdAt: invitation.createdAt.toISOString()
		}
	};
}

export async function listPmClientOnboardingInvitesForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<PmClientInvitationDto[]> {
	return listPmClientInvitationsForProject(input);
}

export async function getPmClientOnboardingPreview(
	token: string
): Promise<PmClientOnboardingPreview | null> {
	await ensurePmClientInvitationIndexes();

	const tokenHash = hashPmClientInvitationToken(token);
	const invitation = await findPmClientInvitationByTokenHash(tokenHash);

	if (!invitation) {
		return null;
	}

	const now = new Date();
	if (
		invitation.status !== PM_CLIENT_INVITATION_STATUSES.PENDING ||
		invitation.expiresAt <= now
	) {
		return null;
	}

	const [workspace, project] = await Promise.all([
		findWorkspaceById(invitation.workspaceId.toString()),
		getPmProjectForWorkspace({
			workspaceId: invitation.workspaceId.toString(),
			projectId: invitation.projectId.toString()
		})
	]);

	if (!workspace || !project) {
		return null;
	}

	return {
		projectTitle: project.title,
		workspaceName: workspace.name,
		projectTypes: project.projectTypes,
		clientEmail: invitation.clientEmail,
		clientName: invitation.clientName,
		expiresAt: invitation.expiresAt.toISOString(),
		alreadySubmitted: Boolean(project.onboarding)
	};
}

export async function submitPmClientOnboarding(input: {
	token: string;
	data: PmClientOnboardingFormInput;
}): Promise<SubmitPmClientOnboardingResult> {
	await ensurePmClientInvitationIndexes();

	const tokenHash = hashPmClientInvitationToken(input.token);
	const invitation = await findPmClientInvitationByTokenHash(tokenHash);

	if (!invitation) {
		return { ok: false, reason: 'INVALID_TOKEN' };
	}

	const now = new Date();
	if (
		invitation.status !== PM_CLIENT_INVITATION_STATUSES.PENDING ||
		invitation.expiresAt <= now
	) {
		return { ok: false, reason: 'INVALID_TOKEN' };
	}

	const project = await getPmProjectForWorkspace({
		workspaceId: invitation.workspaceId.toString(),
		projectId: invitation.projectId.toString()
	});

	if (!project) {
		return { ok: false, reason: 'PROJECT_NOT_FOUND' };
	}

	if (project.onboarding) {
		return { ok: false, reason: 'ALREADY_SUBMITTED' };
	}

	const submittedEmail = input.data.contactEmail.trim().toLowerCase();
	if (submittedEmail !== invitation.clientEmail) {
		return { ok: false, reason: 'EMAIL_MISMATCH' };
	}

	const includeWebsiteFields = pmProjectIncludesWebsite(project.projectTypes);

	const onboarding = mapOnboardingInput(input.data, includeWebsiteFields);

	const updated = await savePmProjectOnboarding({
		workspaceId: invitation.workspaceId.toString(),
		projectId: invitation.projectId.toString(),
		onboarding,
		clientName: project.clientName ?? input.data.businessName
	});

	if (!updated) {
		return { ok: false, reason: 'PROJECT_NOT_FOUND' };
	}

	await markPmClientInvitationCompleted(invitation._id.toString());
	return { ok: true };
}
