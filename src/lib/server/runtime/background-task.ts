import type { RequestEvent } from '@sveltejs/kit';

type PlatformWithWaitUntil = {
	context?: {
		waitUntil?: (promise: Promise<unknown>) => void;
	};
};

/**
 * Run work after the HTTP response without blocking the caller.
 * Uses platform waitUntil when available (serverless); otherwise fire-and-forget on Node.
 */
export function runInBackground(
	event: Pick<RequestEvent, 'platform'>,
	task: () => Promise<void>
): void {
	const promise = task().catch((error) => {
		console.error('Background task failed', error);
	});

	const platform = event.platform as PlatformWithWaitUntil | undefined;
	const waitUntil = platform?.context?.waitUntil;

	if (typeof waitUntil === 'function') {
		waitUntil.call(platform?.context, promise);
		return;
	}

	void promise;
}
