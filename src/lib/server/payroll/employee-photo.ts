import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	isLinodeObjectStorageConfigured,
	uploadPayrollEmployeePhoto
} from '$lib/server/storage/linode';
import {
	isPayrollEmployeePhotoMimeType,
	PAYROLL_EMPLOYEE_PHOTO_MAX_BYTES
} from '$lib/shared/payroll/employee-photo';

const MIME_TO_EXTENSION: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp'
};

export type SavePayrollEmployeePhotoResult =
	| { ok: true; url: string }
	| {
			ok: false;
			reason:
				| 'INVALID_TYPE'
				| 'FILE_TOO_LARGE'
				| 'INVALID_ID'
				| 'STORAGE_NOT_CONFIGURED'
				| 'UPLOAD_FAILED';
	  };

export async function savePayrollEmployeePhoto(input: {
	workspaceId: string;
	employeeId: string;
	file: File;
}): Promise<SavePayrollEmployeePhotoResult> {
	const workspaceId = input.workspaceId.trim();
	const employeeId = input.employeeId.trim();

	if (!/^[a-f\d]{24}$/i.test(workspaceId) || !/^[a-f\d]{24}$/i.test(employeeId)) {
		return { ok: false, reason: 'INVALID_ID' };
	}

	if (!isPayrollEmployeePhotoMimeType(input.file.type)) {
		return { ok: false, reason: 'INVALID_TYPE' };
	}

	if (input.file.size > PAYROLL_EMPLOYEE_PHOTO_MAX_BYTES) {
		return { ok: false, reason: 'FILE_TOO_LARGE' };
	}

	const extension = MIME_TO_EXTENSION[input.file.type];
	const body = Buffer.from(await input.file.arrayBuffer());

	if (isLinodeObjectStorageConfigured()) {
		try {
			const url = await uploadPayrollEmployeePhoto({
				workspaceId,
				employeeId,
				body,
				contentType: input.file.type,
				extension
			});

			return { ok: true, url };
		} catch (error) {
			console.error('Failed to upload payroll employee photo to Linode', error);
			return { ok: false, reason: 'UPLOAD_FAILED' };
		}
	}

	if (process.env.NODE_ENV === 'production') {
		return { ok: false, reason: 'STORAGE_NOT_CONFIGURED' };
	}

	const directory = path.join(
		process.cwd(),
		'static',
		'payroll-employee-photos',
		workspaceId,
		employeeId
	);
	const filename = `photo.${extension}`;
	const absolutePath = path.join(directory, filename);
	const publicUrl = `/payroll-employee-photos/${workspaceId}/${employeeId}/${filename}`;

	await mkdir(directory, { recursive: true });
	await writeFile(absolutePath, body);

	return { ok: true, url: publicUrl };
}

export function extractPayrollEmployeePhotoFromFormData(formData: FormData): {
	photo?: File;
	removePhoto: boolean;
} {
	const photoEntry = formData.get('photo');
	const photo =
		photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : undefined;

	return {
		photo,
		removePhoto: formData.get('removePhoto') === 'true'
	};
}
