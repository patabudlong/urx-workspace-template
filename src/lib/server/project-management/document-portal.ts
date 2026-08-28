import { isMailConfigured } from '$lib/server/mail/index';
import { sendPmClientDocumentsEmail } from '$lib/server/mail/pm-client-documents-email';
import { buildPlatformWorkspaceUrl } from '$lib/server/mail/platform-origin';
import {
	countPmDocumentChecklistItemsForProject,
	createPmDocumentChecklistItem,
	deletePmDocumentChecklistItem,
	listPmDocumentChecklistItemsForProject,
	markPmDocumentChecklistItemSubmitted,
	updatePmDocumentChecklistItemStatus
} from '$lib/server/repositories/pm-document-checklist';
import {
	createPmClientInvitation,
	createPmClientInvitationToken,
	ensurePmClientInvitationIndexes,
	findPmClientInvitationByTokenHash,
	hashPmClientInvitationToken,
	listPmClientInvitationsForProject
} from '$lib/server/repositories/pm-client-invitations';
import { getPmProjectForWorkspace } from '$lib/server/repositories/pm-projects';
import {
	createPmProjectFile,
	listPmProjectFilesForChecklistItem
} from '$lib/server/repositories/pm-project-files';
import { findWorkspaceById } from '$lib/server/repositories/workspaces';
import type { PmClientInvitationDto } from '$lib/shared/models/pm-client-invitation';
import {
	PM_CLIENT_INVITATION_PURPOSES,
	PM_CLIENT_INVITATION_STATUSES
} from '$lib/shared/models/pm-client-invitation';
import type { PmDocumentChecklistItemDto } from '$lib/shared/models/pm-document-checklist-item';
import { PM_DOCUMENT_CHECKLIST_STATUSES } from '$lib/shared/models/pm-document-checklist-item';
import { PM_PROJECT_FILE_UPLOADED_BY } from '$lib/shared/models/pm-project-file';
import { PM_DEFAULT_DOCUMENT_CHECKLIST } from '$lib/shared/project-management/document-checklist-templates';
import { PM_CLIENT_ONBOARDING_TTL_MS } from '$lib/shared/project-management/invitation-ttl';
import { ObjectId } from 'mongodb';
import {
	getPmProjectFileOriginalName,
	savePmProjectFile
} from '$lib/server/project-management/project-file-storage';

export type SendPmDocumentPortalInviteResult =
	| { ok: true; invitation: PmClientInvitationDto }
	| { ok: false; reason: 'MAIL_NOT_CONFIGURED' | 'WORKSPACE_NOT_FOUND' | 'PROJECT_NOT_FOUND' };

export type SubmitPmDocumentUploadResult =
	| { ok: true }
	| {
			ok: false;
			reason:
				| 'INVALID_TOKEN'
				| 'INVALID_ITEM'
				| 'INVALID_TYPE'
				| 'FILE_TOO_LARGE'
				| 'STORAGE_NOT_CONFIGURED'
				| 'UPLOAD_FAILED'
				| 'PROJECT_NOT_FOUND';
	  };

export type PmDocumentPortalPreview = {
	projectTitle: string;
	workspaceName: string;
	clientEmail: string;
	clientName: string | null;
	expiresAt: string;
	items: PmDocumentChecklistItemDto[];
};

async function ensureDefaultChecklistItems(input: {
	workspaceId: string;
	projectId: string;
}): Promise<void> {
	const count = await countPmDocumentChecklistItemsForProject(input);
	if (count > 0) {
		return;
	}

	for (const [index, template] of PM_DEFAULT_DOCUMENT_CHECKLIST.entries()) {
		await createPmDocumentChecklistItem({
			workspaceId: input.workspaceId,
			projectId: input.projectId,
			title: template.title,
			description: template.description,
			required: template.required,
			dueDate: null,
			sortOrder: index
		});
	}
}

export async function listPmDocumentChecklistForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<PmDocumentChecklistItemDto[]> {
	return listPmDocumentChecklistItemsForProject(input);
}

export async function addPmDocumentChecklistItem(input: {
	workspaceId: string;
	projectId: string;
	title: string;
	description: string | null;
	required: boolean;
}): Promise<PmDocumentChecklistItemDto> {
	return createPmDocumentChecklistItem({
		workspaceId: input.workspaceId,
		projectId: input.projectId,
		title: input.title,
		description: input.description,
		required: input.required,
		dueDate: null
	});
}

export async function removePmDocumentChecklistItem(input: {
	workspaceId: string;
	projectId: string;
	itemId: string;
}): Promise<boolean> {
	return deletePmDocumentChecklistItem(input);
}

export async function reviewPmDocumentChecklistItem(input: {
	workspaceId: string;
	projectId: string;
	itemId: string;
	status: typeof PM_DOCUMENT_CHECKLIST_STATUSES.APPROVED | typeof PM_DOCUMENT_CHECKLIST_STATUSES.REJECTED;
	reviewedByUserId: string;
}): Promise<PmDocumentChecklistItemDto | null> {
	return updatePmDocumentChecklistItemStatus({
		workspaceId: input.workspaceId,
		projectId: input.projectId,
		itemId: input.itemId,
		status: input.status,
		reviewedByUserId: input.reviewedByUserId
	});
}

export async function listPmDocumentPortalInvitesForProject(input: {
	workspaceId: string;
	projectId: string;
}): Promise<PmClientInvitationDto[]> {
	return listPmClientInvitationsForProject({
		...input,
		purpose: PM_CLIENT_INVITATION_PURPOSES.DOCUMENTS
	});
}

export async function sendPmDocumentPortalInvite(input: {
	workspaceId: string;
	projectId: string;
	invitedByUserId: string;
	inviterName: string;
	clientEmail: string;
	clientName: string | null;
	origin: string;
	isReminder?: boolean;
}): Promise<SendPmDocumentPortalInviteResult> {
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

	await ensureDefaultChecklistItems({
		workspaceId: input.workspaceId,
		projectId: input.projectId
	});

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
		expiresAt,
		purpose: PM_CLIENT_INVITATION_PURPOSES.DOCUMENTS
	});

	const documentsUrl = buildPlatformWorkspaceUrl(
		input.origin,
		`/client/project-documents?token=${encodeURIComponent(rawToken)}`
	);

	await sendPmClientDocumentsEmail({
		to: input.clientEmail,
		inviterName: input.inviterName,
		workspaceName: workspace.name,
		projectTitle: project.title,
		documentsUrl,
		origin: input.origin,
		expiresAt,
		isReminder: input.isReminder ?? false
	});

	return {
		ok: true,
		invitation: {
			id: invitation._id.toString(),
			workspaceId: invitation.workspaceId.toString(),
			projectId: invitation.projectId.toString(),
			clientEmail: invitation.clientEmail,
			clientName: invitation.clientName,
			purpose: PM_CLIENT_INVITATION_PURPOSES.DOCUMENTS,
			status: invitation.status,
			expiresAt: invitation.expiresAt.toISOString(),
			completedAt: null,
			createdAt: invitation.createdAt.toISOString()
		}
	};
}

export async function sendPmDocumentPortalReminder(input: {
	workspaceId: string;
	projectId: string;
	invitedByUserId: string;
	inviterName: string;
	clientEmail: string;
	clientName: string | null;
	origin: string;
}): Promise<SendPmDocumentPortalInviteResult> {
	return sendPmDocumentPortalInvite({
		...input,
		isReminder: true
	});
}

export async function getPmDocumentPortalPreview(token: string): Promise<PmDocumentPortalPreview | null> {
	await ensurePmClientInvitationIndexes();

	const tokenHash = hashPmClientInvitationToken(token);
	const invitation = await findPmClientInvitationByTokenHash(tokenHash);

	if (!invitation) {
		return null;
	}

	const purpose = invitation.purpose ?? PM_CLIENT_INVITATION_PURPOSES.ONBOARDING;
	if (purpose !== PM_CLIENT_INVITATION_PURPOSES.DOCUMENTS) {
		return null;
	}

	const now = new Date();
	if (
		invitation.status !== PM_CLIENT_INVITATION_STATUSES.PENDING ||
		invitation.expiresAt <= now
	) {
		return null;
	}

	const [workspace, project, items] = await Promise.all([
		findWorkspaceById(invitation.workspaceId.toString()),
		getPmProjectForWorkspace({
			workspaceId: invitation.workspaceId.toString(),
			projectId: invitation.projectId.toString()
		}),
		listPmDocumentChecklistItemsForProject({
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
		clientEmail: invitation.clientEmail,
		clientName: invitation.clientName,
		expiresAt: invitation.expiresAt.toISOString(),
		items
	};
}

export async function submitPmDocumentUpload(input: {
	token: string;
	checklistItemId: string;
	file: File;
}): Promise<SubmitPmDocumentUploadResult> {
	await ensurePmClientInvitationIndexes();

	const tokenHash = hashPmClientInvitationToken(input.token);
	const invitation = await findPmClientInvitationByTokenHash(tokenHash);

	if (!invitation) {
		return { ok: false, reason: 'INVALID_TOKEN' };
	}

	const purpose = invitation.purpose ?? PM_CLIENT_INVITATION_PURPOSES.ONBOARDING;
	if (purpose !== PM_CLIENT_INVITATION_PURPOSES.DOCUMENTS) {
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

	const items = await listPmDocumentChecklistItemsForProject({
		workspaceId: invitation.workspaceId.toString(),
		projectId: invitation.projectId.toString()
	});

	if (!items.some((item) => item.id === input.checklistItemId)) {
		return { ok: false, reason: 'INVALID_ITEM' };
	}

	const fileId = new ObjectId().toString();
	const saved = await savePmProjectFile({
		workspaceId: invitation.workspaceId.toString(),
		projectId: invitation.projectId.toString(),
		fileId,
		file: input.file
	});

	if (!saved.ok) {
		const reason =
			saved.reason === 'INVALID_ID' ? 'UPLOAD_FAILED' : saved.reason;
		return { ok: false, reason };
	}

	await createPmProjectFile({
		workspaceId: invitation.workspaceId.toString(),
		projectId: invitation.projectId.toString(),
		checklistItemId: input.checklistItemId,
		storageKey: saved.storageKey,
		originalFilename: getPmProjectFileOriginalName(input.file.name),
		contentType: input.file.type,
		sizeBytes: input.file.size,
		uploadedBy: PM_PROJECT_FILE_UPLOADED_BY.CLIENT,
		uploadedByEmail: invitation.clientEmail,
		uploadedByUserId: null,
		invitationId: invitation._id.toString()
	});

	await markPmDocumentChecklistItemSubmitted({
		workspaceId: invitation.workspaceId.toString(),
		projectId: invitation.projectId.toString(),
		itemId: input.checklistItemId
	});

	return { ok: true };
}

export async function listPmDocumentFilesForChecklistItem(input: {
	workspaceId: string;
	projectId: string;
	checklistItemId: string;
}) {
	return listPmProjectFilesForChecklistItem(input);
}
