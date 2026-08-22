export const WORKSPACE_LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const WORKSPACE_LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';

export const WORKSPACE_LOGO_MIME_TYPES = [
	'image/png',
	'image/jpeg',
	'image/webp',
	'image/svg+xml'
] as const;

export type WorkspaceLogoMimeType = (typeof WORKSPACE_LOGO_MIME_TYPES)[number];

export const WORKSPACE_LOGO_CROP_OUTPUT_SIZE = 512;
export const WORKSPACE_LOGO_CROP_VIEWPORT_SIZE = 280;

export function isWorkspaceLogoMimeType(type: string): type is WorkspaceLogoMimeType {
	return (WORKSPACE_LOGO_MIME_TYPES as readonly string[]).includes(type);
}

export function isWorkspaceLogoCropSupported(type: string): boolean {
	return type === 'image/png' || type === 'image/jpeg' || type === 'image/webp';
}

export function buildWorkspaceBrandLogoDisplayUrl(input: {
	slug: string;
	brandLogoUrl?: string | null;
	updatedAt?: Date | string | number | null;
}): string | null {
	if (!input.brandLogoUrl?.trim()) {
		return null;
	}

	const version = input.updatedAt ? new Date(input.updatedAt).getTime() : Date.now();

	return `/api/v1/workspaces/${encodeURIComponent(input.slug)}/brand-logo?v=${version}`;
}
