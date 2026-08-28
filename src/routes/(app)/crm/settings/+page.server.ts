import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	deleteCrmSeedForWorkspace,
	getCrmSeedStatusForWorkspace,
	seedCrmWorkspace
} from '$lib/server/repositories/crm-seed';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageCrm } from '$lib/shared/crm/access';
import {
	CRM_SEED_ALREADY_EXISTS_MESSAGE,
	CRM_SEED_CREATE_FAILED_MESSAGE,
	CRM_SEED_CREATED_MESSAGE,
	CRM_SEED_DELETE_FAILED_MESSAGE,
	CRM_SEED_DELETED_MESSAGE,
	CRM_SEED_NOT_FOUND_MESSAGE
} from '$lib/shared/crm/messages';
import { CRM_SEED_SUMMARY } from '$lib/shared/crm/seed';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageCrm: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			meta: {
				title: 'CRM settings'
			},
			seedStatus: {
				seeded: false,
				companyCount: 0,
				contactCount: 0,
				dealCount: 0
			},
			seedSummary: CRM_SEED_SUMMARY
		};
	}

	const seedStatus = await getCrmSeedStatusForWorkspace(workspace.workspaceId);

	return {
		meta: {
			title: 'CRM settings'
		},
		seedStatus,
		seedSummary: CRM_SEED_SUMMARY
	};
};

export const actions: Actions = {
	seed: async ({ url, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Authentication required.' });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageCrm(workspace.role)) {
			return fail(403, { message: 'CRM access required.' });
		}

		try {
			await seedCrmWorkspace(workspace.workspaceId);
		} catch (error) {
			if (error instanceof Error && error.message === 'CRM seed already exists') {
				return fail(409, { message: CRM_SEED_ALREADY_EXISTS_MESSAGE });
			}

			return fail(500, { message: CRM_SEED_CREATE_FAILED_MESSAGE });
		}

		return { message: CRM_SEED_CREATED_MESSAGE };
	},
	deleteSeed: async ({ url, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Authentication required.' });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageCrm(workspace.role)) {
			return fail(403, { message: 'CRM access required.' });
		}

		try {
			await deleteCrmSeedForWorkspace(workspace.workspaceId);
		} catch (error) {
			if (error instanceof Error && error.message === 'CRM seed not found') {
				return fail(404, { message: CRM_SEED_NOT_FOUND_MESSAGE });
			}

			return fail(500, { message: CRM_SEED_DELETE_FAILED_MESSAGE });
		}

		return { message: CRM_SEED_DELETED_MESSAGE };
	}
};
