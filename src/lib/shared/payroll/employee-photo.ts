export const PAYROLL_EMPLOYEE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

export const PAYROLL_EMPLOYEE_PHOTO_ACCEPT = 'image/png,image/jpeg,image/webp';

export const PAYROLL_EMPLOYEE_PHOTO_MIME_TYPES = [
	'image/png',
	'image/jpeg',
	'image/webp'
] as const;

export type PayrollEmployeePhotoMimeType = (typeof PAYROLL_EMPLOYEE_PHOTO_MIME_TYPES)[number];

export function isPayrollEmployeePhotoMimeType(type: string): type is PayrollEmployeePhotoMimeType {
	return (PAYROLL_EMPLOYEE_PHOTO_MIME_TYPES as readonly string[]).includes(type);
}

export function isPayrollEmployeePhotoCropSupported(type: string): boolean {
	return isPayrollEmployeePhotoMimeType(type);
}

export function buildPayrollEmployeePhotoDisplayUrl(input: {
	photoUrl?: string | null;
	updatedAt?: string | Date | number | null;
}): string | null {
	if (!input.photoUrl?.trim()) {
		return null;
	}

	const version = input.updatedAt ? new Date(input.updatedAt).getTime() : Date.now();
	const separator = input.photoUrl.includes('?') ? '&' : '?';

	return `${input.photoUrl}${separator}v=${version}`;
}

export function getPayrollEmployeeInitials(firstName: string, lastName: string): string {
	const first = firstName.trim().charAt(0);
	const last = lastName.trim().charAt(0);
	const initials = `${first}${last}`.toUpperCase();

	return initials || '?';
}
