import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { uploadWorkspaceBrandLogo, isLinodeObjectStorageConfigured } from '$lib/server/storage/linode';
import {
	isWorkspaceLogoMimeType,
	WORKSPACE_LOGO_MAX_BYTES
} from '$lib/shared/workspace-branding';

const MIME_TO_EXTENSION: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/svg+xml': 'svg'
};

export type SaveWorkspaceBrandLogoResult =
	| { ok: true; url: string }
	| {
			ok: false;
			reason:
				| 'INVALID_TYPE'
				| 'FILE_TOO_LARGE'
				| 'INVALID_SLUG'
				| 'STORAGE_NOT_CONFIGURED'
				| 'UPLOAD_FAILED';
	  };

export async function saveWorkspaceBrandLogo(input: {
	slug: string;
	file: File;
}): Promise<SaveWorkspaceBrandLogoResult> {
	const slug = input.slug.trim().toLowerCase();

	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		return { ok: false, reason: 'INVALID_SLUG' };
	}

	if (!isWorkspaceLogoMimeType(input.file.type)) {
		return { ok: false, reason: 'INVALID_TYPE' };
	}

	if (input.file.size > WORKSPACE_LOGO_MAX_BYTES) {
		return { ok: false, reason: 'FILE_TOO_LARGE' };
	}

	const extension = MIME_TO_EXTENSION[input.file.type];
	const body = Buffer.from(await input.file.arrayBuffer());

	if (isLinodeObjectStorageConfigured()) {
		try {
			const url = await uploadWorkspaceBrandLogo({
				slug,
				body,
				contentType: input.file.type,
				extension
			});

			return { ok: true, url };
		} catch (error) {
			console.error('Failed to upload workspace brand logo to Linode', error);
			return { ok: false, reason: 'UPLOAD_FAILED' };
		}
	}

	if (process.env.NODE_ENV === 'production') {
		return { ok: false, reason: 'STORAGE_NOT_CONFIGURED' };
	}

	const directory = path.join(process.cwd(), 'static', 'workspace-branding', slug);
	const filename = `logo.${extension}`;
	const absolutePath = path.join(directory, filename);
	const publicUrl = `/workspace-branding/${slug}/${filename}`;

	await mkdir(directory, { recursive: true });
	await writeFile(absolutePath, body);

	return { ok: true, url: publicUrl };
}
