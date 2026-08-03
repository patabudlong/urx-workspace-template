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

export const TEAM_MEMBER_UPDATED_MESSAGE = 'Member role updated.';

export function formatTeamMemberUpdatedMessage(input: {
	memberName: string;
	roleLabel: string;
}): string {
	const subject = input.memberName.trim() || 'This member';
	return `${subject} is now a ${input.roleLabel.toLowerCase()}.`;
}

export const TEAM_MEMBER_UPDATE_FAILED_MESSAGE =
	'We could not update this member. Refresh the page and try again.';

export const TEAM_MEMBER_UPDATE_FORBIDDEN_MESSAGE =
	'You do not have permission to change workspace member roles.';

export const TEAM_MEMBER_CANNOT_UPDATE_OWNER_MESSAGE =
	'The workspace owner role cannot be changed here.';

export const TEAM_MEMBER_CANNOT_UPDATE_SELF_MESSAGE =
	'You cannot change your own role. Ask another admin or the workspace owner.';
