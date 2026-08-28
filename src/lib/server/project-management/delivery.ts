import {
	createPmProjectMilestone,
	deletePmProjectMilestone,
	listPmProjectMilestonesForProject,
	updatePmProjectMilestoneStatus
} from '$lib/server/repositories/pm-project-milestones';
import {
	listPmProjectActivityForProject,
	logPmProjectActivity
} from '$lib/server/repositories/pm-project-activity';
import type { PmProjectMilestoneStatus } from '$lib/shared/models/pm-project-milestone';
import { PM_PROJECT_ACTIVITY_TYPES } from '$lib/shared/models/pm-project-activity';
import { PM_PROJECT_MILESTONE_STATUSES } from '$lib/shared/models/pm-project-milestone';

export {
	listPmProjectMilestonesForProject,
	listPmProjectActivityForProject,
	logPmProjectActivity
};

export async function addPmProjectMilestone(input: {
	workspaceId: string;
	projectId: string;
	title: string;
	description: string | null;
	actorUserId: string;
}) {
	const milestone = await createPmProjectMilestone({
		workspaceId: input.workspaceId,
		projectId: input.projectId,
		title: input.title,
		description: input.description
	});

	await logPmProjectActivity({
		workspaceId: input.workspaceId,
		projectId: input.projectId,
		type: PM_PROJECT_ACTIVITY_TYPES.COMMENT,
		body: `Added milestone: ${milestone.title}`,
		actorUserId: input.actorUserId
	});

	return milestone;
}

export async function setPmProjectMilestoneStatus(input: {
	workspaceId: string;
	projectId: string;
	milestoneId: string;
	status: PmProjectMilestoneStatus;
	actorUserId: string;
}) {
	const milestone = await updatePmProjectMilestoneStatus(input);

	if (!milestone) {
		return null;
	}

	if (input.status === PM_PROJECT_MILESTONE_STATUSES.COMPLETED) {
		await logPmProjectActivity({
			workspaceId: input.workspaceId,
			projectId: input.projectId,
			type: PM_PROJECT_ACTIVITY_TYPES.MILESTONE_COMPLETED,
			body: `Completed milestone: ${milestone.title}`,
			actorUserId: input.actorUserId
		});
	}

	return milestone;
}

export async function removePmProjectMilestone(input: {
	workspaceId: string;
	projectId: string;
	milestoneId: string;
}) {
	return deletePmProjectMilestone(input);
}

export async function addPmProjectComment(input: {
	workspaceId: string;
	projectId: string;
	body: string;
	actorUserId: string;
}) {
	await logPmProjectActivity({
		workspaceId: input.workspaceId,
		projectId: input.projectId,
		type: PM_PROJECT_ACTIVITY_TYPES.COMMENT,
		body: input.body,
		actorUserId: input.actorUserId
	});
}
