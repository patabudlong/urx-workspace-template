import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { extractPayrollEmployeePhotoFromFormData } from '$lib/server/payroll/employee-photo';
import {
	createPayrollEmployeeSchema,
	updatePayrollEmployeeSchema,
	type CreatePayrollEmployeeInput
} from '$lib/shared/payroll/schemas';

type PayrollEmployeeFormSubmission = {
	form: SuperValidated<CreatePayrollEmployeeInput>;
	photo?: File;
	removePhoto: boolean;
};

export async function parsePayrollEmployeeFormSubmission(
	request: Request
): Promise<PayrollEmployeeFormSubmission> {
	const contentType = request.headers.get('content-type') ?? '';

	if (contentType.includes('multipart/form-data')) {
		const formData = await request.formData();
		const form = await superValidate(formData, zod4(createPayrollEmployeeSchema));
		const { photo, removePhoto } = extractPayrollEmployeePhotoFromFormData(formData);

		return { form, photo, removePhoto };
	}

	const form = await superValidate(request, zod4(createPayrollEmployeeSchema));

	return { form, removePhoto: false };
}

export async function parsePayrollEmployeeUpdateFormSubmission(
	request: Request
): Promise<PayrollEmployeeFormSubmission> {
	const contentType = request.headers.get('content-type') ?? '';

	if (contentType.includes('multipart/form-data')) {
		const formData = await request.formData();
		const form = await superValidate(formData, zod4(updatePayrollEmployeeSchema));
		const { photo, removePhoto } = extractPayrollEmployeePhotoFromFormData(formData);

		return { form, photo, removePhoto };
	}

	const form = await superValidate(request, zod4(updatePayrollEmployeeSchema));

	return { form, removePhoto: false };
}
