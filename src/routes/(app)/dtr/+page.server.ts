import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDtrSettingsForWorkspace } from '$lib/server/repositories/dtr-settings';
import { countPayrollEmployeesForWorkspace } from '$lib/server/repositories/payroll-employees';

export const load: PageServerLoad = async ({ parent, isDataRequest }) => {
	const { workspace, canManageDtr, hasLinkedPayrollEmployee } = await parent();

	if (!canManageDtr && hasLinkedPayrollEmployee) {
		redirect(302, '/dtr/clock');
	}

	if (!workspace || !canManageDtr) {
		return {
			employeeCount: 0,
			settingsConfigured: false
		};
	}

	const countsQuery = Promise.all([
		countPayrollEmployeesForWorkspace(workspace.workspaceId),
		getDtrSettingsForWorkspace(workspace.workspaceId)
	]).then(([employeeCount, settings]) => ({
		employeeCount,
		settingsConfigured: settings.configured
	}));

	if (isDataRequest) {
		return {
			employeeCount: countsQuery.then((counts) => counts.employeeCount),
			settingsConfigured: countsQuery.then((counts) => counts.settingsConfigured)
		};
	}

	const counts = await countsQuery;

	return {
		employeeCount: counts.employeeCount,
		settingsConfigured: counts.settingsConfigured
	};
};
