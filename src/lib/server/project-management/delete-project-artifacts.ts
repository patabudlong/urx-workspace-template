import { deletePmDocumentChecklistItemsForProject } from '$lib/server/repositories/pm-document-checklist';
import { deletePmClientInvitationsForProject } from '$lib/server/repositories/pm-client-invitations';
import { deletePmProjectActivityForProject } from '$lib/server/repositories/pm-project-activity';
import { deletePmProjectMilestonesForProject } from '$lib/server/repositories/pm-project-milestones';
import {
	deletePmProjectFilesForProject,
	listPmProjectFileStorageKeysForProject
} from '$lib/server/repositories/pm-project-files';
import { deletePrivateObjects } from '$lib/server/storage/linode';

export async function deletePmProjectArtifacts(input: {
	workspaceId: string;
	projectId: string;
}): Promise<void> {
	const storageKeys = await listPmProjectFileStorageKeysForProject(input);

	await Promise.all([
		deletePmClientInvitationsForProject(input),
		deletePmDocumentChecklistItemsForProject(input),
		deletePmProjectFilesForProject(input),
		deletePmProjectMilestonesForProject(input),
		deletePmProjectActivityForProject(input)
	]);

	if (storageKeys.length > 0) {
		await deletePrivateObjects(storageKeys);
	}
}
