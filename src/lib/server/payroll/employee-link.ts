import { findUserByEmail } from '$lib/server/repositories/users';
import { findWorkspaceMemberByWorkspaceAndUserId } from '$lib/server/repositories/workspace-members';
import { ObjectId } from 'mongodb';

export async function resolvePayrollEmployeeUserId(input: {
	workspaceId: string;
	email: string | null;
}): Promise<ObjectId | null> {
	if (!input.email) {
		return null;
	}

	const user = await findUserByEmail(input.email);

	if (!user) {
		return null;
	}

	const membership = await findWorkspaceMemberByWorkspaceAndUserId({
		workspaceId: input.workspaceId,
		userId: user._id.toString()
	});

	if (!membership) {
		return null;
	}

	return user._id;
}
