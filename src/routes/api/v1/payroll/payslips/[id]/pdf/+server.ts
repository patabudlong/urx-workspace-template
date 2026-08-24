import type { RequestHandler } from './$types';
import { jsonError } from '$lib/server/api/response';
import {
	requirePayrollMemberWorkspace,
	requirePayrollWorkspace
} from '$lib/server/payroll/api-context';
import { findPayrollEmployeeForWorkspaceUser } from '$lib/server/repositories/payroll-employees';
import { getPayrollPayslipForWorkspace } from '$lib/server/repositories/payroll-payslips';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import {
	generatePayslipPdfBuffer,
	getPayslipPdfFilename
} from '$lib/server/payroll/payslip-pdf';
import {
	PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE,
	PAYROLL_PAYSLIP_NOT_FOUND_MESSAGE
} from '$lib/shared/payroll/messages';
import { canManagePayroll } from '$lib/shared/payroll/access';
import { payrollPayslipIdParamSchema } from '$lib/shared/payroll/schemas';

export const GET: RequestHandler = async ({ locals, request, url, params }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;

	const adminContext = await requirePayrollWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	let workspaceId: string | null = null;

	if (adminContext.ok) {
		workspaceId = adminContext.workspace.workspaceId;
	} else {
		const memberContext = await requirePayrollMemberWorkspace({
			userId: locals.user?.id,
			url,
			requestId
		});

		if (!memberContext.ok) {
			return memberContext.response;
		}

		workspaceId = memberContext.workspace.workspaceId;
	}

	const parsedParams = payrollPayslipIdParamSchema.safeParse(params);
	if (!parsedParams.success) {
		return jsonError('BAD_REQUEST', 'Invalid payslip id', {
			details: { issues: parsedParams.error.flatten() },
			requestId
		});
	}

	let employeeId: string | undefined;

	if (!adminContext.ok || !canManagePayroll(adminContext.workspace.role)) {
		if (!locals.user?.id) {
			return jsonError('FORBIDDEN', PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE, { requestId });
		}

		const employee = await findPayrollEmployeeForWorkspaceUser({
			workspaceId: workspaceId!,
			userId: locals.user.id,
			email: locals.user.email
		});

		if (!employee) {
			return jsonError('FORBIDDEN', PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE, { requestId });
		}

		employeeId = employee.id;
	}

	const payslip = await getPayrollPayslipForWorkspace({
		workspaceId: workspaceId!,
		payslipId: parsedParams.data.id,
		employeeId
	});

	if (!payslip) {
		return jsonError('NOT_FOUND', PAYROLL_PAYSLIP_NOT_FOUND_MESSAGE, { requestId });
	}

	const settings = await getPayrollSettingsForWorkspace(workspaceId!);
	const pdfBuffer = await generatePayslipPdfBuffer(payslip, settings.currency);
	const filename = getPayslipPdfFilename(payslip);

	return new Response(new Uint8Array(pdfBuffer), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'private, no-store'
		}
	});
};
