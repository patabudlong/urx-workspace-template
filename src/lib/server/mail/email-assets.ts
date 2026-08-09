import { resolvePlatformWorkspaceOrigin } from '$lib/server/mail/platform-origin';
import {
	EMAIL_ASSET_PREFIX,
	EMAIL_ASSETS,
	type EmailAssetName
} from '$lib/shared/mail/email-asset-names';
import { getLinodeObjectStorageConfig } from '$lib/server/storage/linode';

export { EMAIL_ASSET_PREFIX, EMAIL_ASSETS, type EmailAssetName } from '$lib/shared/mail/email-asset-names';

/**
 * Public URL for a transactional email asset.
 * Uses Linode Object Storage when configured; otherwise falls back to static `/email/*` on the platform origin.
 */
export function resolveEmailAssetUrl(filename: EmailAssetName | string, requestOrigin?: string): string {
	const linode = getLinodeObjectStorageConfig();

	if (linode) {
		return `${linode.publicBase}/${EMAIL_ASSET_PREFIX}/${filename}`;
	}

	if (!requestOrigin) {
		throw new Error(
			'requestOrigin is required to resolve email assets when Linode Object Storage is not configured'
		);
	}

	return `${resolvePlatformWorkspaceOrigin(requestOrigin)}/${EMAIL_ASSET_PREFIX}/${filename}`;
}

export function resolveEmailLogoUrl(requestOrigin?: string): string {
	return resolveEmailAssetUrl(EMAIL_ASSETS.logo, requestOrigin);
}
