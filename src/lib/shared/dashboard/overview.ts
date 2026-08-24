import type { PresenceStatus } from '$lib/shared/presence';
import type { WorkspacePackageId } from '$lib/shared/workspace-packages';

export type WorkspaceOverviewMember = {
	id: string;
	name: string;
	email: string;
	avatarUrl: string | null;
	initials: string;
	role: string;
	roleLabel: string;
	presenceStatus: PresenceStatus;
};

export type WorkspaceOverviewModule = {
	id: WorkspacePackageId;
	label: string;
	description: string;
	enabled: boolean;
	href: string;
};

export type WorkspaceOverviewActivity = {
	id: string;
	timestamp: string;
	title: string;
	detail?: string;
};

export type WorkspaceGrowthPoint = {
	label: string;
	value: number;
};

export type WorkspaceOverview = {
	memberCount: number;
	onlineCount: number;
	pendingInvitationCount: number;
	enabledModuleCount: number;
	totalModuleCount: number;
	membersJoinedThisMonth: number;
	membersJoinedLastMonth: number;
	members: WorkspaceOverviewMember[];
	modules: WorkspaceOverviewModule[];
	activities: WorkspaceOverviewActivity[];
	growth: WorkspaceGrowthPoint[];
};
