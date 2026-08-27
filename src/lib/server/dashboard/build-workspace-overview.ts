import { listWorkspaceMembersForDisplay } from '$lib/server/team/workspace-member-directory';
import { listPendingWorkspaceInvitations } from '$lib/server/repositories/workspace-invitations';
import type {
	WorkspaceGrowthPoint,
	WorkspaceOverview,
	WorkspaceOverviewActivity,
	WorkspaceOverviewMember,
	WorkspaceOverviewModule
} from '$lib/shared/dashboard/overview';
import { PRESENCE_STATUSES } from '$lib/shared/presence';
import type { WorkspaceContext } from '$lib/shared/workspace-context';
import {
	isWorkspacePackageEnabled,
	WORKSPACE_PACKAGE_CATALOG,
	WORKSPACE_PACKAGE_IDS,
	type WorkspacePackageId
} from '$lib/shared/workspace-packages';

const PACKAGE_MODULE_HREFS: Record<WorkspacePackageId, string> = {
	[WORKSPACE_PACKAGE_IDS.MAILBOX]: '/mailbox/INBOX',
	[WORKSPACE_PACKAGE_IDS.PAYROLL]: '/payroll',
	[WORKSPACE_PACKAGE_IDS.DTR]: '/dtr',
// urixoft-workspace-accounting:dashboard-href:start
	[WORKSPACE_PACKAGE_IDS.ACCOUNTING]: '/accounting'
// urixoft-workspace-accounting:dashboard-href:end
};

const GROWTH_MONTHS = 6;
const MEMBER_PREVIEW_LIMIT = 6;
const ACTIVITY_LIMIT = 8;

function buildGrowthSeries(joinedAtValues: string[]): WorkspaceGrowthPoint[] {
	const now = new Date();
	const points: WorkspaceGrowthPoint[] = [];

	for (let offset = GROWTH_MONTHS - 1; offset >= 0; offset -= 1) {
		const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
		const monthEnd = new Date(
			now.getFullYear(),
			now.getMonth() - offset + 1,
			0,
			23,
			59,
			59,
			999
		);
		const label = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(monthStart);
		const value = joinedAtValues.filter((joinedAt) => {
			const joined = new Date(joinedAt);

			return joined >= monthStart && joined <= monthEnd;
		}).length;

		points.push({ label, value });
	}

	return points;
}

function buildActivities(input: {
	members: Awaited<ReturnType<typeof listWorkspaceMembersForDisplay>>;
	invitations: Awaited<ReturnType<typeof listPendingWorkspaceInvitations>>;
}): WorkspaceOverviewActivity[] {
	const joinActivities: WorkspaceOverviewActivity[] = [...input.members]
		.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
		.slice(0, 4)
		.map((member) => ({
			id: `join-${member.id}`,
			timestamp: member.joinedAt,
			title: `${member.name} joined the workspace`,
			detail: member.roleLabel
		}));

	const inviteActivities: WorkspaceOverviewActivity[] = input.invitations
		.slice(0, 4)
		.map((invitation) => ({
			id: `invite-${invitation._id.toString()}`,
			timestamp: invitation.createdAt.toISOString(),
			title: `Invitation sent to ${invitation.invitedEmail}`,
			detail: 'Pending acceptance'
		}));

	return [...joinActivities, ...inviteActivities]
		.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
		.slice(0, ACTIVITY_LIMIT);
}

function buildModules(workspace: WorkspaceContext): WorkspaceOverviewModule[] {
	return WORKSPACE_PACKAGE_CATALOG.map((entry) => {
		const enabled = isWorkspacePackageEnabled(workspace.enabledPackages, entry.id);

		return {
			id: entry.id,
			label: entry.label,
			description: entry.description,
			enabled,
			href: enabled ? PACKAGE_MODULE_HREFS[entry.id] : '/modules'
		};
	});
}

export async function buildWorkspaceOverview(workspace: WorkspaceContext): Promise<WorkspaceOverview> {
	const [memberships, invitations] = await Promise.all([
		listWorkspaceMembersForDisplay(workspace.workspaceId),
		listPendingWorkspaceInvitations(workspace.workspaceId)
	]);

	const members: WorkspaceOverviewMember[] = memberships.map((member) => ({
		id: member.id,
		name: member.name,
		email: member.email,
		avatarUrl: member.avatarUrl,
		initials: member.initials,
		role: member.role,
		roleLabel: member.roleLabel,
		presenceStatus: member.presenceStatus,
		joinedAt: member.joinedAt
	}));

	const growth = buildGrowthSeries(memberships.map((member) => member.joinedAt));
	const membersJoinedThisMonth = growth.at(-1)?.value ?? 0;
	const membersJoinedLastMonth = growth.at(-2)?.value ?? 0;
	const modules = buildModules(workspace);
	const enabledModuleCount = modules.filter((module) => module.enabled).length;

	return {
		memberCount: members.length,
		onlineCount: members.filter((member) => member.presenceStatus !== PRESENCE_STATUSES.OFFLINE)
			.length,
		pendingInvitationCount: invitations.length,
		enabledModuleCount,
		totalModuleCount: modules.length,
		membersJoinedThisMonth,
		membersJoinedLastMonth,
		members: members.slice(0, MEMBER_PREVIEW_LIMIT),
		modules,
		activities: buildActivities({ members: memberships, invitations }),
		growth
	};
}
