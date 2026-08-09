import type { OnboardingAccessState } from '$lib/server/onboarding/workspace-onboarding';

type ApiSuccessResponse<T> = {
	data: T;
};

type ApiErrorResponse = {
	error: {
		code: string;
		message: string;
	};
};

export async function fetchOnboardingAccess(): Promise<OnboardingAccessState> {
	const response = await fetch('/api/v1/onboarding/access');
	const body = (await response.json()) as
		| ApiSuccessResponse<{ access: OnboardingAccessState }>
		| ApiErrorResponse;

	if (!response.ok) {
		const message = 'error' in body ? body.error.message : 'Unable to check onboarding status.';
		throw new Error(message);
	}

	return (body as ApiSuccessResponse<{ access: OnboardingAccessState }>).data.access;
}
