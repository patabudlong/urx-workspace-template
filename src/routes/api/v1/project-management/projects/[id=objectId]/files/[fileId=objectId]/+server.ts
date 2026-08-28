import type { RequestHandler } from './$types';
import { jsonError } from '$lib/server/api/response';
import { requireProjectManagementWorkspace } from '$lib/server/project-management/api-context';
import { readPmProjectFile } from '$lib/server/project-management/project-file-storage';
import { getPmProjectFileForWorkspace } from '$lib/server/repositories/pm-project-files';

export const GET: RequestHandler = async ({ locals, request, url, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireProjectManagementWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	const file = await getPmProjectFileForWorkspace({
		workspaceId: context.workspace.workspaceId,
		projectId: params.id,
		fileId: params.fileId
	});

	if (!file) {
		return jsonError('NOT_FOUND', 'File not found', { requestId });
	}

	const stored = await readPmProjectFile(file.storageKey);
	if (!stored) {
		return jsonError('NOT_FOUND', 'File not found', { requestId });
	}

	return new Response(new Uint8Array(stored.body), {
		headers: {
			'Content-Type': file.contentType,
			'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalFilename)}"`,
			'Cache-Control': 'private, no-store'
		}
	});
};
