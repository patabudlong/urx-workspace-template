import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireWorkspaceModuleOwnerApiContext } from '$lib/server/modules/api-context';
import {
	generateWorkspaceModuleIntegrationCredentials,
	getWorkspaceModuleIntegrationCredentialsStatus,
	updateWorkspaceModuleIntegrationAuthBaseUri
} from '$lib/server/repositories/workspace-module-integration-credentials';
import { workspaceModuleIntegrationAuthBaseUriSchema } from '$lib/shared/workspace-module-integrations';
import { workspacePackageIdSchema } from '$lib/shared/workspace-packages';

function parsePackageId(packageId: string) {
	return workspacePackageIdSchema.safeParse(packageId);
}

export const GET: RequestHandler = async ({ locals, params, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const parsedPackageId = parsePackageId(params.packageId);

	if (!parsedPackageId.success) {
		return jsonError('BAD_REQUEST', 'Invalid module package id', { requestId });
	}

	const context = await requireWorkspaceModuleOwnerApiContext({
		userId: locals.user?.id,
		url,
		packageId: parsedPackageId.data,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const status = await getWorkspaceModuleIntegrationCredentialsStatus({
		workspaceId: context.workspace.workspaceId,
		packageId: parsedPackageId.data
	});

	return jsonOk(status, { requestId });
};

export const POST: RequestHandler = async ({ locals, params, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const parsedPackageId = parsePackageId(params.packageId);

	if (!parsedPackageId.success) {
		return jsonError('BAD_REQUEST', 'Invalid module package id', { requestId });
	}

	const context = await requireWorkspaceModuleOwnerApiContext({
		userId: locals.user?.id,
		url,
		packageId: parsedPackageId.data,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	try {
		const result = await generateWorkspaceModuleIntegrationCredentials({
			workspaceId: context.workspace.workspaceId,
			packageId: parsedPackageId.data
		});

		return jsonOk(result, { requestId, status: result.configured ? 200 : 201 });
	} catch {
		return jsonError('INTERNAL_ERROR', 'Unable to generate integration credentials.', {
			requestId
		});
	}
};

export const PUT: RequestHandler = async ({ locals, params, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const parsedPackageId = parsePackageId(params.packageId);

	if (!parsedPackageId.success) {
		return jsonError('BAD_REQUEST', 'Invalid module package id', { requestId });
	}

	const context = await requireWorkspaceModuleOwnerApiContext({
		userId: locals.user?.id,
		url,
		packageId: parsedPackageId.data,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const body = await request.json().catch(() => null);
	const parsedBody = workspaceModuleIntegrationAuthBaseUriSchema.safeParse(body);

	if (!parsedBody.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsedBody.error.flatten() },
			requestId
		});
	}

	try {
		const status = await updateWorkspaceModuleIntegrationAuthBaseUri({
			workspaceId: context.workspace.workspaceId,
			packageId: parsedPackageId.data,
			authBaseUri: parsedBody.data.authBaseUri
		});

		return jsonOk(status, { requestId });
	} catch (error) {
		if (error instanceof Error && error.message === 'CREDENTIALS_NOT_CONFIGURED') {
			return jsonError('BAD_REQUEST', 'Generate client credentials before saving settings.', {
				requestId
			});
		}

		return jsonError('INTERNAL_ERROR', 'Unable to save integration credentials.', { requestId });
	}
};
