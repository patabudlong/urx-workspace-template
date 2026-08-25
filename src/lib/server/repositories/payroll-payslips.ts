import type {
	PayrollPayslipDocument,
	PayrollPayslipDto
} from '$lib/shared/models/payroll-payslip';
import { getPayrollPayslipsCollection } from '$lib/server/db/collections';
import { formatPayrollEmployeeFullName } from '$lib/shared/payroll/employee-name';
import { normalizePayrollPayslipDocument } from '$lib/shared/payroll/payslip-normalize';
import { ObjectId } from 'mongodb';

let payrollPayslipIndexesPromise: Promise<void> | null = null;

const PAYROLL_PAYSLIP_PROJECTION = {
	workspaceId: 1,
	runId: 1,
	employeeId: 1,
	runTitle: 1,
	periodStart: 1,
	periodEnd: 1,
	employeeFirstName: 1,
	employeeInitialName: 1,
	employeeLastName: 1,
	employeeCode: 1,
	employeeTin: 1,
	employeeDepartment: 1,
	jobTitle: 1,
	payType: 1,
	payRateCents: 1,
	basePayCents: 1,
	overtimePayCents: 1,
	holidayPayCents: 1,
	restDayPayCents: 1,
	nightShiftPayCents: 1,
	otherEarningsCents: 1,
	otherEarningLines: 1,
	grossCents: 1,
	deductionLines: 1,
	totalDeductionsCents: 1,
	netCents: 1,
	workedMinutes: 1,
	workDays: 1,
	paidMinutes: 1,
	paidDays: 1,
	ytdGrossCents: 1,
	ytdNetCents: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toPayrollPayslipDto(doc: PayrollPayslipDocument): PayrollPayslipDto {
	const normalized = normalizePayrollPayslipDocument(doc);

	return {
		id: normalized._id.toString(),
		workspaceId: normalized.workspaceId.toString(),
		runId: normalized.runId.toString(),
		employeeId: normalized.employeeId.toString(),
		runTitle: normalized.runTitle,
		periodStart: normalized.periodStart.toISOString(),
		periodEnd: normalized.periodEnd.toISOString(),
		employeeFirstName: normalized.employeeFirstName,
		employeeInitialName: normalized.employeeInitialName ?? null,
		employeeLastName: normalized.employeeLastName,
		employeeFullName: formatPayrollEmployeeFullName({
			firstName: normalized.employeeFirstName,
			initialName: normalized.employeeInitialName,
			lastName: normalized.employeeLastName
		}),
		employeeCode: normalized.employeeCode,
		employeeTin: normalized.employeeTin,
		employeeDepartment: normalized.employeeDepartment,
		jobTitle: normalized.jobTitle,
		payType: normalized.payType,
		payRateCents: normalized.payRateCents,
		basePayCents: normalized.basePayCents,
		overtimePayCents: normalized.overtimePayCents,
		holidayPayCents: normalized.holidayPayCents,
		restDayPayCents: normalized.restDayPayCents,
		nightShiftPayCents: normalized.nightShiftPayCents,
		otherEarningsCents: normalized.otherEarningsCents,
		otherEarningLines: normalized.otherEarningLines,
		grossCents: normalized.grossCents,
		deductionLines: normalized.deductionLines,
		totalDeductionsCents: normalized.totalDeductionsCents,
		netCents: normalized.netCents,
		workedMinutes: normalized.workedMinutes,
		workDays: normalized.workDays,
		paidMinutes: normalized.paidMinutes,
		paidDays: normalized.paidDays,
		ytdGrossCents: normalized.ytdGrossCents,
		ytdNetCents: normalized.ytdNetCents,
		createdAt: normalized.createdAt.toISOString(),
		updatedAt: normalized.updatedAt.toISOString()
	};
}

export async function ensurePayrollPayslipIndexes(): Promise<void> {
	if (!payrollPayslipIndexesPromise) {
		payrollPayslipIndexesPromise = (async () => {
			const collection = await getPayrollPayslipsCollection();
			await collection.createIndex({ workspaceId: 1, runId: 1, employeeId: 1 }, { unique: true });
			await collection.createIndex({ workspaceId: 1, employeeId: 1, periodEnd: -1 });
			await collection.createIndex({ workspaceId: 1, runId: 1, createdAt: -1 });
		})();
	}

	await payrollPayslipIndexesPromise;
}

export async function computePayslipYtdTotals(input: {
	workspaceId: string;
	employeeId: string;
	periodEnd: string;
}): Promise<{ ytdGrossCents: number; ytdNetCents: number }> {
	await ensurePayrollPayslipIndexes();

	if (!ObjectId.isValid(input.employeeId)) {
		return { ytdGrossCents: 0, ytdNetCents: 0 };
	}

	const year = input.periodEnd.slice(0, 4);
	const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
	const periodEnd = new Date(input.periodEnd);

	const collection = await getPayrollPayslipsCollection<PayrollPayslipDocument>();
	const results = await collection
		.aggregate<{ ytdGrossCents: number; ytdNetCents: number }>([
			{
				$match: {
					workspaceId: new ObjectId(input.workspaceId),
					employeeId: new ObjectId(input.employeeId),
					periodEnd: { $gte: yearStart, $lte: periodEnd }
				}
			},
			{
				$group: {
					_id: null,
					ytdGrossCents: { $sum: '$grossCents' },
					ytdNetCents: { $sum: '$netCents' }
				}
			}
		])
		.toArray();

	const totals = results[0];

	return {
		ytdGrossCents: totals?.ytdGrossCents ?? 0,
		ytdNetCents: totals?.ytdNetCents ?? 0
	};
}

export async function listPayrollPayslipsForRun(input: {
	workspaceId: string;
	runId: string;
	page: number;
	limit: number;
}): Promise<{ items: PayrollPayslipDto[]; total: number }> {
	await ensurePayrollPayslipIndexes();

	if (!ObjectId.isValid(input.runId)) {
		return { items: [], total: 0 };
	}

	const collection = await getPayrollPayslipsCollection<PayrollPayslipDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const runObjectId = new ObjectId(input.runId);
	const skip = (input.page - 1) * input.limit;
	const filter = { workspaceId: workspaceObjectId, runId: runObjectId };

	const [items, total] = await Promise.all([
		collection
			.find(filter, { projection: PAYROLL_PAYSLIP_PROJECTION })
			.sort({ employeeLastName: 1, employeeFirstName: 1 })
			.skip(skip)
			.limit(input.limit)
			.toArray(),
		collection.countDocuments(filter)
	]);

	return {
		items: items.map(toPayrollPayslipDto),
		total
	};
}

export async function listPayrollPayslipsForEmployee(input: {
	workspaceId: string;
	employeeId: string;
	page: number;
	limit: number;
}): Promise<{ items: PayrollPayslipDto[]; total: number }> {
	await ensurePayrollPayslipIndexes();

	if (!ObjectId.isValid(input.employeeId)) {
		return { items: [], total: 0 };
	}

	const collection = await getPayrollPayslipsCollection<PayrollPayslipDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const employeeObjectId = new ObjectId(input.employeeId);
	const skip = (input.page - 1) * input.limit;
	const filter = { workspaceId: workspaceObjectId, employeeId: employeeObjectId };

	const [items, total] = await Promise.all([
		collection
			.find(filter, { projection: PAYROLL_PAYSLIP_PROJECTION })
			.sort({ periodEnd: -1, createdAt: -1 })
			.skip(skip)
			.limit(input.limit)
			.toArray(),
		collection.countDocuments(filter)
	]);

	return {
		items: items.map(toPayrollPayslipDto),
		total
	};
}

export async function getPayrollPayslipForWorkspace(input: {
	workspaceId: string;
	payslipId: string;
	employeeId?: string;
}): Promise<PayrollPayslipDto | null> {
	await ensurePayrollPayslipIndexes();

	if (!ObjectId.isValid(input.payslipId)) {
		return null;
	}

	const collection = await getPayrollPayslipsCollection<PayrollPayslipDocument>();
	const filter: Record<string, unknown> = {
		_id: new ObjectId(input.payslipId),
		workspaceId: new ObjectId(input.workspaceId)
	};

	if (input.employeeId && ObjectId.isValid(input.employeeId)) {
		filter.employeeId = new ObjectId(input.employeeId);
	}

	const payslip = await collection.findOne(filter, { projection: PAYROLL_PAYSLIP_PROJECTION });

	return payslip ? toPayrollPayslipDto(payslip) : null;
}

export async function countPayrollPayslipsForRun(
	workspaceId: string,
	runId: string
): Promise<number> {
	await ensurePayrollPayslipIndexes();

	if (!ObjectId.isValid(runId)) {
		return 0;
	}

	const collection = await getPayrollPayslipsCollection<PayrollPayslipDocument>();
	return collection.countDocuments({
		workspaceId: new ObjectId(workspaceId),
		runId: new ObjectId(runId)
	});
}

export async function replacePayrollPayslipsForRun(input: {
	workspaceId: string;
	runId: string;
	payslips: Omit<PayrollPayslipDocument, '_id' | 'createdAt' | 'updatedAt'>[];
}): Promise<void> {
	await ensurePayrollPayslipIndexes();

	const collection = await getPayrollPayslipsCollection<PayrollPayslipDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const runObjectId = new ObjectId(input.runId);
	const now = new Date();

	await collection.deleteMany({ workspaceId: workspaceObjectId, runId: runObjectId });

	if (input.payslips.length === 0) {
		return;
	}

	await collection.insertMany(
		input.payslips.map((payslip) => ({
			...payslip,
			createdAt: now,
			updatedAt: now
		})) as PayrollPayslipDocument[]
	);
}

export async function deletePayrollPayslipsForRun(workspaceId: string, runId: string): Promise<void> {
	await ensurePayrollPayslipIndexes();

	if (!ObjectId.isValid(runId)) {
		return;
	}

	const collection = await getPayrollPayslipsCollection<PayrollPayslipDocument>();
	await collection.deleteMany({
		workspaceId: new ObjectId(workspaceId),
		runId: new ObjectId(runId)
	});
}
