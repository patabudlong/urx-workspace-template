import { resolvePlatformWorkspaceOrigin } from '$lib/server/mail/platform-origin';
import {
	PH_DEDUCTION_ICON_FILES,
	PH_DEDUCTION_ICON_KEYS,
	PH_DEDUCTION_ICON_PREFIX,
	type PhDeductionIconKey
} from '$lib/shared/payroll/deduction-icon-names';
import { getLinodeObjectStorageConfig } from '$lib/server/storage/linode';

export function resolvePhDeductionIconUrl(
	iconKey: PhDeductionIconKey,
	requestOrigin?: string
): string {
	const filename = PH_DEDUCTION_ICON_FILES[iconKey];
	const linode = getLinodeObjectStorageConfig();

	if (linode) {
		return `${linode.publicBase}/${PH_DEDUCTION_ICON_PREFIX}/${filename}`;
	}

	if (!requestOrigin) {
		throw new Error(
			'requestOrigin is required to resolve PH deduction icons when Linode Object Storage is not configured'
		);
	}

	return `${resolvePlatformWorkspaceOrigin(requestOrigin)}/${PH_DEDUCTION_ICON_PREFIX}/${filename}`;
}

export function buildPhDeductionIconUrlMap(requestOrigin: string): Record<PhDeductionIconKey, string> {
	return Object.fromEntries(
		PH_DEDUCTION_ICON_KEYS.map((key) => [key, resolvePhDeductionIconUrl(key, requestOrigin)])
	) as Record<PhDeductionIconKey, string>;
}
