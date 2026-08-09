export const DEFAULT_LOCAL_GOOGLE_OAUTH_ORIGIN = 'http://localhost:5173';

export function isLocalDevHostname(hostname: string): boolean {
	const normalized = hostname.toLowerCase();

	return (
		normalized === 'localhost' || normalized === '127.0.0.1' || normalized.endsWith('.localhost')
	);
}

export function isLocalWorkspaceHostSuffix(suffix: string): boolean {
	const normalized = suffix.trim().toLowerCase();

	return normalized === 'localhost' || normalized.endsWith('.localhost');
}

export function resolveLocalGoogleOAuthOrigin(port = '5173'): string {
	return `http://localhost:${port}`;
}

export function resolveGoogleOAuthOrigin(input: {
	configuredOrigin?: string | null;
	hostname: string;
	workspaceHostSuffix: string;
	protocol: string;
	port: string;
}): string {
	const configured = input.configuredOrigin?.trim();

	if (configured) {
		return configured.replace(/\/$/, '');
	}

	if (input.hostname === 'localhost' || input.hostname === '127.0.0.1') {
		const port = input.port ? `:${input.port}` : '';
		return `${input.protocol}//${input.hostname}${port}`;
	}

	if (isLocalWorkspaceHostSuffix(input.workspaceHostSuffix)) {
		return resolveLocalGoogleOAuthOrigin(input.port || '5173');
	}

	const port = input.port ? `:${input.port}` : '';

	return `${input.protocol}//${input.workspaceHostSuffix}${port}`;
}
