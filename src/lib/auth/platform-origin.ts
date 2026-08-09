import {
	resolveGoogleOAuthOrigin,
	resolveLocalGoogleOAuthOrigin
} from '$lib/shared/platform-auth-origin';
import { getPublicWorkspaceHostSuffix } from '$lib/workspace-host';

export function getPlatformAuthOriginFromWindow(): string {
	return resolveGoogleOAuthOrigin({
		configuredOrigin: import.meta.env.PUBLIC_GOOGLE_OAUTH_ORIGIN,
		hostname: window.location.hostname.toLowerCase(),
		workspaceHostSuffix: getPublicWorkspaceHostSuffix(),
		protocol: window.location.protocol,
		port: window.location.port
	});
}

export { resolveLocalGoogleOAuthOrigin };
