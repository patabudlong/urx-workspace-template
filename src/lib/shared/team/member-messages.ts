export const TEAM_MEMBER_REMOVED_MESSAGE =
	'This person no longer has access to this workspace.';

export function formatTeamMemberRemovedMessage(memberName: string): string {
	const subject = memberName.trim() || 'This person';
	return `${subject} no longer has access to this workspace.`;
}

export const TEAM_MEMBER_REMOVE_FAILED_MESSAGE =
	'We could not remove this member. Refresh the page and try again.';

export const TEAM_MEMBER_REMOVE_FORBIDDEN_MESSAGE =
	'You do not have permission to remove workspace members.';

export const TEAM_MEMBER_CANNOT_REMOVE_OWNER_MESSAGE =
	'The workspace owner cannot be removed.';
