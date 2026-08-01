import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const MIME_TO_EXTENSION: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/svg+xml': 'svg'
};

const ALLOWED_MIME_TYPES = new Set(Object.keys(MIME_TO_EXTENSION));

export type SaveWorkspaceBrandLogoResult =
	| { ok: true; url: string }
	| { ok: false; reason: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'INVALID_SLUG' };

export async function saveWorkspaceBrandLogo(input: {
	slug: string;
	file: File;
}): Promise<SaveWorkspaceBrandLogoResult> {
	const slug = input.slug.trim().toLowerCase();

	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		return { ok: false, reason: 'INVALID_SLUG' };
	}

	if (!ALLOWED_MIME_TYPES.has(input.file.type)) {
		return { ok: false, reason: 'INVALID_TYPE' };
	}

	if (input.file.size > MAX_LOGO_BYTES) {
		return { ok: false, reason: 'FILE_TOO_LARGE' };
	}

	const extension = MIME_TO_EXTENSION[input.file.type];
	const directory = path.join(process.cwd(), 'static', 'workspace-branding', slug);
	const filename = `logo.${extension}`;
	const absolutePath = path.join(directory, filename);
	const publicUrl = `/workspace-branding/${slug}/${filename}`;

	await mkdir(directory, { recursive: true });
	await writeFile(absolutePath, Buffer.from(await input.file.arrayBuffer()));

	return { ok: true, url: publicUrl };
}
