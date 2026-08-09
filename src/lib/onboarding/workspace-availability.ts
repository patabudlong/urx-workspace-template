import type { WorkspaceAvailabilityResult } from '$lib/shared/schemas/workspace-availability';

type ApiSuccessResponse<T> = {
	data: T;
};

type ApiErrorResponse = {
	error: {
		code: string;
		message: string;
	};
};

export async function fetchWorkspaceAvailability(input: {
	name?: string;
	slug?: string;
}): Promise<WorkspaceAvailabilityResult> {
	const params = new URLSearchParams();

	if (input.name) {
		params.set('name', input.name);
	}

	if (input.slug) {
		params.set('slug', input.slug);
	}

	const response = await fetch(`/api/v1/workspaces/availability?${params.toString()}`);

	const body = (await response.json()) as ApiSuccessResponse<WorkspaceAvailabilityResult> | ApiErrorResponse;

	if (!response.ok) {
		const message =
			'error' in body ? body.error.message : 'Unable to check workspace availability.';
		throw new Error(message);
	}

	return (body as ApiSuccessResponse<WorkspaceAvailabilityResult>).data;
}
