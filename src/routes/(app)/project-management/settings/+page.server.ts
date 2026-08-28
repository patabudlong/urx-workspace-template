import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	deletePmSeedForWorkspace,
	getPmSeedStatusForWorkspace,
	seedPmWorkspace
} from '$lib/server/repositories/pm-seed';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageProjectManagement } from '$lib/shared/project-management/access';
import {
	PM_SEED_ALREADY_EXISTS_MESSAGE,
	PM_SEED_CREATE_FAILED_MESSAGE,
	PM_SEED_CREATED_MESSAGE,
	PM_SEED_DELETE_FAILED_MESSAGE,
	PM_SEED_DELETED_MESSAGE,
	PM_SEED_NOT_FOUND_MESSAGE
} from '$lib/shared/project-management/messages';
import { PM_SEED_SUMMARY } from '$lib/shared/project-management/seed';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageProjectManagement: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			meta: {
				title: 'Project Management settings'
			},
			seedStatus: {
				seeded: false,
				projectCount: 0
			},
			seedSummary: PM_SEED_SUMMARY
		};
	}

	const seedStatus = await getPmSeedStatusForWorkspace(workspace.workspaceId);

	return {
		meta: {
			title: 'Project Management settings'
		},
		seedStatus,
		seedSummary: PM_SEED_SUMMARY
	};
};

export const actions: Actions = {
	seed: async ({ url, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Authentication required.' });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { message: 'Project Management access required.' });
		}

		try {
			await seedPmWorkspace(workspace.workspaceId);
		} catch (error) {
			if (error instanceof Error && error.message === 'PM seed already exists') {
				return fail(409, { message: PM_SEED_ALREADY_EXISTS_MESSAGE });
			}

			return fail(500, { message: PM_SEED_CREATE_FAILED_MESSAGE });
		}

		return { message: PM_SEED_CREATED_MESSAGE };
	},
	deleteSeed: async ({ url, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Authentication required.' });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageProjectManagement(workspace.role)) {
			return fail(403, { message: 'Project Management access required.' });
		}

		try {
			await deletePmSeedForWorkspace(workspace.workspaceId);
		} catch (error) {
			if (error instanceof Error && error.message === 'PM seed not found') {
				return fail(404, { message: PM_SEED_NOT_FOUND_MESSAGE });
			}

			return fail(500, { message: PM_SEED_DELETE_FAILED_MESSAGE });
		}

		return { message: PM_SEED_DELETED_MESSAGE };
	}
};
