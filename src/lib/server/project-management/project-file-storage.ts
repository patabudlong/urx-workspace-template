import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	getPrivateObject,
	isLinodeObjectStorageConfigured,
	uploadPrivateObject
} from '$lib/server/storage/linode';
import {
	isPmProjectFileMimeType,
	PM_PROJECT_FILE_MAX_BYTES
} from '$lib/shared/project-management/project-files';

const MIME_TO_EXTENSION: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/svg+xml': 'svg',
	'application/pdf': 'pdf',
	'application/msword': 'doc',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
	'application/vnd.ms-excel': 'xls',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
	'text/plain': 'txt'
};

function sanitizeFilename(filename: string): string {
	return filename.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
}

function buildStorageKey(input: {
	workspaceId: string;
	projectId: string;
	fileId: string;
	extension: string;
}): string {
	return `workspaces/${input.workspaceId}/project-management/projects/${input.projectId}/documents/${input.fileId}.${input.extension}`;
}

function buildDevStoragePath(storageKey: string): string {
	return path.join(process.cwd(), 'static', 'pm-project-files', storageKey);
}

export type SavePmProjectFileResult =
	| { ok: true; storageKey: string }
	| {
			ok: false;
			reason: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'INVALID_ID' | 'STORAGE_NOT_CONFIGURED' | 'UPLOAD_FAILED';
	  };

export async function savePmProjectFile(input: {
	workspaceId: string;
	projectId: string;
	fileId: string;
	file: File;
}): Promise<SavePmProjectFileResult> {
	const workspaceId = input.workspaceId.trim();
	const projectId = input.projectId.trim();
	const fileId = input.fileId.trim();

	if (
		!/^[a-f\d]{24}$/i.test(workspaceId) ||
		!/^[a-f\d]{24}$/i.test(projectId) ||
		!/^[a-f\d]{24}$/i.test(fileId)
	) {
		return { ok: false, reason: 'INVALID_ID' };
	}

	if (!isPmProjectFileMimeType(input.file.type)) {
		return { ok: false, reason: 'INVALID_TYPE' };
	}

	if (input.file.size > PM_PROJECT_FILE_MAX_BYTES) {
		return { ok: false, reason: 'FILE_TOO_LARGE' };
	}

	const extension = MIME_TO_EXTENSION[input.file.type] ?? 'bin';
	const storageKey = buildStorageKey({ workspaceId, projectId, fileId, extension });
	const body = Buffer.from(await input.file.arrayBuffer());

	if (isLinodeObjectStorageConfigured()) {
		try {
			await uploadPrivateObject({
				key: storageKey,
				body,
				contentType: input.file.type
			});

			return { ok: true, storageKey };
		} catch (error) {
			console.error('Failed to upload PM project file to Linode', error);
			return { ok: false, reason: 'UPLOAD_FAILED' };
		}
	}

	if (process.env.NODE_ENV === 'production') {
		return { ok: false, reason: 'STORAGE_NOT_CONFIGURED' };
	}

	const absolutePath = buildDevStoragePath(storageKey);
	await mkdir(path.dirname(absolutePath), { recursive: true });
	await writeFile(absolutePath, body);

	return { ok: true, storageKey };
}

export async function readPmProjectFile(storageKey: string): Promise<{
	body: Buffer;
	contentType: string;
} | null> {
	if (isLinodeObjectStorageConfigured()) {
		return getPrivateObject({ key: storageKey });
	}

	if (process.env.NODE_ENV === 'production') {
		return null;
	}

	try {
		const body = await readFile(buildDevStoragePath(storageKey));
		const extension = storageKey.split('.').pop()?.toLowerCase();
		const contentType =
			extension === 'pdf'
				? 'application/pdf'
				: extension === 'png'
					? 'image/png'
					: extension === 'jpg'
						? 'image/jpeg'
						: 'application/octet-stream';

		return { body, contentType };
	} catch {
		return null;
	}
}

export function getPmProjectFileOriginalName(filename: string): string {
	return sanitizeFilename(filename);
}
