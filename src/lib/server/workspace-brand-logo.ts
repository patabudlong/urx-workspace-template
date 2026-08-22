import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	getWorkspaceBrandLogoObject,
	LOGO_EXTENSIONS
} from '$lib/server/storage/linode';

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	webp: 'image/webp',
	svg: 'image/svg+xml'
};

export type WorkspaceBrandLogoAsset = {
	body: Buffer;
	contentType: string;
};

export async function loadWorkspaceBrandLogoAsset(
	slug: string
): Promise<WorkspaceBrandLogoAsset | null> {
	const normalizedSlug = slug.trim().toLowerCase();

	for (const extension of LOGO_EXTENSIONS) {
		const localPath = path.join(
			process.cwd(),
			'static',
			'workspace-branding',
			normalizedSlug,
			`logo.${extension}`
		);

		try {
			const body = await readFile(localPath);

			return {
				body,
				contentType: EXTENSION_CONTENT_TYPES[extension] ?? 'application/octet-stream'
			};
		} catch {
			// Try the next local extension.
		}
	}

	for (const extension of LOGO_EXTENSIONS) {
		const remote = await getWorkspaceBrandLogoObject({
			slug: normalizedSlug,
			extension
		});

		if (remote) {
			return remote;
		}
	}

	return null;
}
