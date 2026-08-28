export const PM_PROJECT_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const PM_PROJECT_FILE_ACCEPT =
	'image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain';

export const PM_PROJECT_FILE_MIME_TYPES = [
	'image/png',
	'image/jpeg',
	'image/webp',
	'image/svg+xml',
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'text/plain'
] as const;

export type PmProjectFileMimeType = (typeof PM_PROJECT_FILE_MIME_TYPES)[number];

export function isPmProjectFileMimeType(type: string): type is PmProjectFileMimeType {
	return (PM_PROJECT_FILE_MIME_TYPES as readonly string[]).includes(type);
}

export function formatPmProjectFileSize(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}

	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
