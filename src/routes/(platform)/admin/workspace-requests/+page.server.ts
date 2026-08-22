import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { findUserById } from '$lib/server/repositories/users';
import { listPendingWorkspaces } from '$lib/server/repositories/workspaces';
import {
	approveWorkspaceOwnerRequest,
	rejectWorkspaceOwnerRequest
} from '$lib/server/onboarding/workspace-approval';
import { isSuperadminUser } from '$lib/server/auth/platform-admin';
import {
	filterEnabledPackagesForDeployment,
	listDeployableWorkspacePackages
} from '$lib/server/workspace-packages/installed';
import { workspacePackageIdsSchema } from '$lib/shared/workspace-packages';

export const load: PageServerLoad = async ({ locals }) => {
	const admin = await findUserById(locals.user!.id);

	if (!admin || !isSuperadminUser(admin)) {
		error(403, 'Forbidden');
	}

	const pending = await listPendingWorkspaces();

	const requests = await Promise.all(
		pending.map(async (workspace) => {
			const requester = await findUserById(workspace.requestedByUserId.toString());

			return {
				id: workspace._id.toString(),
				name: workspace.name,
				slug: workspace.slug,
				teamSize: workspace.teamSize,
				contactPhone: workspace.contactPhone,
				country: workspace.address.country,
				city: workspace.address.city,
				website: workspace.website,
				createdAt: workspace.createdAt.toISOString(),
				requester: requester
					? {
							name: `${requester.firstName} ${requester.lastName}`.trim(),
							email: requester.email
						}
					: null
			};
		})
	);

	const deployablePackages = await listDeployableWorkspacePackages();

	return {
		requests,
		deployablePackages,
		meta: {
			title: 'Workspace requests'
		}
	};
};

export const actions: Actions = {
	approve: async ({ request, locals, url }) => {
		const admin = await findUserById(locals.user!.id);

		if (!admin || !isSuperadminUser(admin)) {
			error(403, 'Forbidden');
		}

		const formData = await request.formData();
		const workspaceId = formData.get('workspaceId');
		const enabledPackageValues = formData.getAll('enabledPackages');

		if (typeof workspaceId !== 'string' || !workspaceId) {
			return fail(400, { message: 'Missing workspace ID.' });
		}

		const parsedPackages = workspacePackageIdsSchema.safeParse(
			enabledPackageValues.filter((value): value is string => typeof value === 'string')
		);

		if (!parsedPackages.success) {
			return fail(400, { message: 'Invalid workspace package selection.' });
		}

		const deployablePackages = await listDeployableWorkspacePackages();
		const enabledPackages = filterEnabledPackagesForDeployment(
			parsedPackages.data,
			deployablePackages.map((entry) => entry.id)
		);

		const result = await approveWorkspaceOwnerRequest({
			workspaceId,
			reviewedByUserId: locals.user!.id,
			origin: url.origin,
			enabledPackages
		});

		if (!result.ok) {
			return fail(404, { message: 'Workspace request not found or already processed.' });
		}

		return { success: true };
	},
	reject: async ({ request, locals }) => {
		const admin = await findUserById(locals.user!.id);

		if (!admin || !isSuperadminUser(admin)) {
			error(403, 'Forbidden');
		}

		const formData = await request.formData();
		const workspaceId = formData.get('workspaceId');
		const rejectionReason = formData.get('rejectionReason');

		if (typeof workspaceId !== 'string' || !workspaceId) {
			return fail(400, { message: 'Missing workspace ID.' });
		}

		const result = await rejectWorkspaceOwnerRequest({
			workspaceId,
			reviewedByUserId: locals.user!.id,
			rejectionReason: typeof rejectionReason === 'string' ? rejectionReason : undefined
		});

		if (!result.ok) {
			return fail(404, { message: 'Workspace request not found or already processed.' });
		}

		return { success: true };
	}
};
