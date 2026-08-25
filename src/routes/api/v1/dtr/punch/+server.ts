import type { RequestHandler } from './$types';
import { jsonError, jsonOk } from '$lib/server/api/response';
import { requireDtrMemberWorkspace } from '$lib/server/dtr/api-context';
import { isDtrDayLockedError } from '$lib/server/dtr/errors';
import { upsertDtrDayForWorkspace, getDtrDayForWorkspace } from '$lib/server/repositories/dtr-days';
import { findPayrollEmployeeForWorkspaceUser } from '$lib/server/repositories/payroll-employees';
import {
	DTR_PUNCH_COMPLETE_MESSAGE,
	DTR_PUNCH_LOCKED_MESSAGE,
	DTR_PUNCH_SUCCESS_MESSAGE
} from '$lib/shared/dtr/messages';
import {
	applyDtrPunch,
	formatDtrClockTime,
	getTodayDtrDate,
	resolveDtrPunchState
} from '$lib/shared/dtr/punch';
import { dtrPunchSchema } from '$lib/shared/dtr/schemas';

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const requestId = request.headers.get('x-request-id') ?? undefined;
	const context = await requireDtrMemberWorkspace({
		userId: locals.user?.id,
		url,
		requestId
	});

	if (!context.ok) {
		return context.response;
	}

	if (!locals.user?.id) {
		return jsonError('UNAUTHORIZED', 'Sign in required', { requestId });
	}

	const employee = await findPayrollEmployeeForWorkspaceUser({
		workspaceId: context.workspace.workspaceId,
		userId: locals.user.id,
		email: locals.user.email
	});

	if (!employee) {
		return jsonError('FORBIDDEN', 'Employee record not linked', { requestId });
	}

	let body: unknown = {};
	try {
		const raw = await request.text();
		if (raw.trim()) {
			body = JSON.parse(raw);
		}
	} catch {
		return jsonError('BAD_REQUEST', 'Invalid JSON body', { requestId });
	}

	const parsed = dtrPunchSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError('BAD_REQUEST', 'Invalid request body', {
			details: { issues: parsed.error.flatten() },
			requestId
		});
	}

	const date = parsed.data.date ?? getTodayDtrDate();
	const existing = await getDtrDayForWorkspace({
		workspaceId: context.workspace.workspaceId,
		employeeId: employee.id,
		date
	});

	const punchState = resolveDtrPunchState(existing);

	if (!punchState.nextSlot) {
		return jsonError('CONFLICT', DTR_PUNCH_COMPLETE_MESSAGE, { requestId });
	}

	const punched = applyDtrPunch({
		record: existing,
		slot: punchState.nextSlot,
		time: formatDtrClockTime()
	});

	const day = await upsertDtrDayForWorkspace({
		workspaceId: context.workspace.workspaceId,
		data: {
			employeeId: employee.id,
			date,
			status: punched.status,
			morningTimeIn: punched.morningTimeIn ?? '',
			morningTimeOut: punched.morningTimeOut ?? '',
			afternoonTimeIn: punched.afternoonTimeIn ?? '',
			afternoonTimeOut: punched.afternoonTimeOut ?? '',
			source: 'biometric',
			notes: ''
		}
	}).catch((error) => {
		if (isDtrDayLockedError(error)) {
			return null;
		}

		throw error;
	});

	if (!day) {
		return jsonError('CONFLICT', DTR_PUNCH_LOCKED_MESSAGE, { requestId });
	}

	return jsonOk(
		{
			day,
			message: DTR_PUNCH_SUCCESS_MESSAGE,
			punchedSlot: punchState.nextSlot,
			punchedTime: formatDtrClockTime()
		},
		{ status: 201, requestId }
	);
};
