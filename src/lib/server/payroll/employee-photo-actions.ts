import {
	savePayrollEmployeePhoto,
	type SavePayrollEmployeePhotoResult
} from '$lib/server/payroll/employee-photo';
import { updatePayrollEmployeePhotoUrl } from '$lib/server/repositories/payroll-employees';
import {
	PAYROLL_EMPLOYEE_PHOTO_INVALID_MESSAGE,
	PAYROLL_EMPLOYEE_PHOTO_STORAGE_NOT_CONFIGURED_MESSAGE,
	PAYROLL_EMPLOYEE_PHOTO_TOO_LARGE_MESSAGE,
	PAYROLL_EMPLOYEE_PHOTO_UPLOAD_FAILED_MESSAGE
} from '$lib/shared/payroll/messages';

export function mapPayrollEmployeePhotoSaveError(
	reason: Exclude<SavePayrollEmployeePhotoResult, { ok: true }>['reason']
): string {
	switch (reason) {
		case 'INVALID_TYPE':
			return PAYROLL_EMPLOYEE_PHOTO_INVALID_MESSAGE;
		case 'FILE_TOO_LARGE':
			return PAYROLL_EMPLOYEE_PHOTO_TOO_LARGE_MESSAGE;
		case 'STORAGE_NOT_CONFIGURED':
			return PAYROLL_EMPLOYEE_PHOTO_STORAGE_NOT_CONFIGURED_MESSAGE;
		case 'INVALID_ID':
		case 'UPLOAD_FAILED':
			return PAYROLL_EMPLOYEE_PHOTO_UPLOAD_FAILED_MESSAGE;
	}
}

export async function applyPayrollEmployeePhotoChanges(input: {
	workspaceId: string;
	employeeId: string;
	photo?: File;
	removePhoto?: boolean;
}): Promise<{ ok: true } | { ok: false; message: string }> {
	if (input.removePhoto) {
		const updated = await updatePayrollEmployeePhotoUrl({
			workspaceId: input.workspaceId,
			employeeId: input.employeeId,
			photoUrl: null
		});

		if (!updated) {
			return { ok: false, message: PAYROLL_EMPLOYEE_PHOTO_UPLOAD_FAILED_MESSAGE };
		}

		return { ok: true };
	}

	if (!input.photo) {
		return { ok: true };
	}

	const saved = await savePayrollEmployeePhoto({
		workspaceId: input.workspaceId,
		employeeId: input.employeeId,
		file: input.photo
	});

	if (!saved.ok) {
		return { ok: false, message: mapPayrollEmployeePhotoSaveError(saved.reason) };
	}

	const updated = await updatePayrollEmployeePhotoUrl({
		workspaceId: input.workspaceId,
		employeeId: input.employeeId,
		photoUrl: saved.url
	});

	if (!updated) {
		return { ok: false, message: PAYROLL_EMPLOYEE_PHOTO_UPLOAD_FAILED_MESSAGE };
	}

	return { ok: true };
}
