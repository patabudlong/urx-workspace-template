import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { isMailConfigured } from '$lib/server/mail/index';
import { sendPayslipEmail } from '$lib/server/mail/payslip-email';
import {
	requirePayrollMemberWorkspace,
	requirePayrollWorkspace
} from '$lib/server/payroll/api-context';
import {
	findPayrollEmployeeForWorkspaceUser,
	getPayrollEmployeeForWorkspace
} from '$lib/server/repositories/payroll-employees';
import { getPayrollPayslipForWorkspace } from '$lib/server/repositories/payroll-payslips';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import {
	buildSecurityEventRequestContext,
	recordPayrollSecurityEvent
} from '$lib/server/security/record-security-event';
import {
	PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE,
	PAYROLL_PAYSLIP_EMAIL_FAILED_MESSAGE,
	PAYROLL_PAYSLIP_EMAIL_NOT_CONFIGURED_MESSAGE,
	PAYROLL_PAYSLIP_EMAIL_SENT_MESSAGE,
	PAYROLL_PAYSLIP_NOT_FOUND_MESSAGE
} from '$lib/shared/payroll/messages';
import { canManagePayroll } from '$lib/shared/payroll/access';
import { payrollPayslipIdParamSchema } from '$lib/shared/payroll/schemas';
import { SECURITY_EVENT_ACTIONS } from '$lib/shared/models/security-event';

export const POST: RequestHandler = async (event) => {
	const { locals, request, url, params, getClientAddress } = event;
	const requestId = request.headers.get('x-request-id') ?? undefined;

	if (!isMailConfigured()) {
		return jsonError('SERVICE_UNAVAILABLE', PAYROLL_PAYSLIP_EMAIL_NOT_CONFIGURED_MESSAGE, {
			requestId
		});
	}

	const adminContext = await requirePayrollWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	let workspaceId: string | null = null;
	let workspaceName = '';

	if (adminContext.ok) {
		workspaceId = adminContext.workspace.workspaceId;
		workspaceName = adminContext.workspace.workspaceName;
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
		workspaceName = memberContext.workspace.workspaceName;
	}

	const parsedParams = payrollPayslipIdParamSchema.safeParse(params);
	if (!parsedParams.success) {
		return jsonError('BAD_REQUEST', 'Invalid payslip id', {
			details: { issues: parsedParams.error.flatten() },
			requestId
		});
	}

	let employeeId: string | undefined;
	let recipientEmail: string | null = null;

	const payslipPreview = await getPayrollPayslipForWorkspace({
		workspaceId: workspaceId!,
		payslipId: parsedParams.data.id
	});

	if (!payslipPreview) {
		return jsonError('NOT_FOUND', PAYROLL_PAYSLIP_NOT_FOUND_MESSAGE, { requestId });
	}

	if (adminContext.ok && canManagePayroll(adminContext.workspace.role)) {
		const employee = await getPayrollEmployeeForWorkspace({
			workspaceId: workspaceId!,
			employeeId: payslipPreview.employeeId
		});

		recipientEmail = employee?.email ?? null;
	} else {
		if (!locals.user?.id) {
			return jsonError('FORBIDDEN', PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE, { requestId });
		}

		const employee = await findPayrollEmployeeForWorkspaceUser({
			workspaceId: workspaceId!,
			userId: locals.user.id,
			email: locals.user.email
		});

		if (!employee || employee.id !== payslipPreview.employeeId) {
			return jsonError('FORBIDDEN', PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE, { requestId });
		}

		employeeId = employee.id;
		recipientEmail = employee.email ?? locals.user.email ?? null;
	}

	const payslip = await getPayrollPayslipForWorkspace({
		workspaceId: workspaceId!,
		payslipId: parsedParams.data.id,
		employeeId
	});

	if (!payslip) {
		return jsonError('NOT_FOUND', PAYROLL_PAYSLIP_NOT_FOUND_MESSAGE, { requestId });
	}

	if (!recipientEmail) {
		return jsonError('BAD_REQUEST', 'No email address is available for this payslip.', {
			requestId
		});
	}

	const settings = await getPayrollSettingsForWorkspace(workspaceId!);
	const payslipUrl = `${url.origin}/payroll/payslips/${payslip.id}`;

	try {
		await sendPayslipEmail({
			to: recipientEmail,
			workspaceName,
			payslip,
			currency: settings.currency,
			payslipUrl,
			origin: url.origin,
			registeredCompanyName: settings.registeredCompanyName,
			showYtdTotals: settings.showYtdTotals
		});
	} catch {
		return jsonError('INTERNAL_ERROR', PAYROLL_PAYSLIP_EMAIL_FAILED_MESSAGE, { requestId });
	}

	if (locals.user?.id) {
		await recordPayrollSecurityEvent({
			workspaceId: workspaceId!,
			actorUserId: locals.user.id,
			action: SECURITY_EVENT_ACTIONS.PAYROLL_PAYSLIP_EMAILED,
			...buildSecurityEventRequestContext({ request, getClientAddress }),
			metadata: {
				detail: `Emailed payslip to ${recipientEmail}.`,
				payslipId: payslip.id,
				recipientEmail,
				employeeId: payslip.employeeId
			}
		});
	}

	return jsonOk({ sent: true, message: PAYROLL_PAYSLIP_EMAIL_SENT_MESSAGE }, { requestId });
};
