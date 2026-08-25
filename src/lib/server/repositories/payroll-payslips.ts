import type {
	PayrollPayslipDocument,
	PayrollPayslipDto
} from '$lib/shared/models/payroll-payslip';
import { getPayrollPayslipsCollection } from '$lib/server/db/collections';
import { formatPayrollEmployeeFullName } from '$lib/shared/payroll/employee-name';
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
	jobTitle: 1,
	payType: 1,
	payRateCents: 1,
	basePayCents: 1,
	holidayPayCents: 1,
	grossCents: 1,
	deductionLines: 1,
	totalDeductionsCents: 1,
	netCents: 1,
	workedMinutes: 1,
	workDays: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toPayrollPayslipDto(doc: PayrollPayslipDocument): PayrollPayslipDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		runId: doc.runId.toString(),
		employeeId: doc.employeeId.toString(),
		runTitle: doc.runTitle,
		periodStart: doc.periodStart.toISOString(),
		periodEnd: doc.periodEnd.toISOString(),
		employeeFirstName: doc.employeeFirstName,
		employeeInitialName: doc.employeeInitialName ?? null,
		employeeLastName: doc.employeeLastName,
		employeeFullName: formatPayrollEmployeeFullName({
			firstName: doc.employeeFirstName,
			initialName: doc.employeeInitialName,
			lastName: doc.employeeLastName
		}),
		employeeCode: doc.employeeCode,
		jobTitle: doc.jobTitle,
		payType: doc.payType,
		payRateCents: doc.payRateCents,
		basePayCents: doc.basePayCents,
		holidayPayCents: doc.holidayPayCents,
		grossCents: doc.grossCents,
		deductionLines: doc.deductionLines,
		totalDeductionsCents: doc.totalDeductionsCents,
		netCents: doc.netCents,
		workedMinutes: doc.workedMinutes,
		workDays: doc.workDays,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
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
