import type {
	PayrollEmployeeDocument,
	PayrollEmployeeDto
} from '$lib/shared/models/payroll-employee';
import { getPayrollEmployeesCollection } from '$lib/server/db/collections';
import { getDtrWorkScheduleForWorkspace } from '$lib/server/repositories/dtr-work-schedules';
import type { PayrollEmployeeDeduction } from '$lib/shared/payroll/deductions';
import { percentToBasisPoints } from '$lib/shared/payroll/deductions';
import { dollarsToCents } from '$lib/shared/payroll/format';
import type { CreatePayrollEmployeeInput } from '$lib/shared/payroll/schemas';
import { normalizePayrollPayType } from '$lib/shared/payroll/pay-rate';
import { MongoServerError, ObjectId } from 'mongodb';

let payrollEmployeeIndexesPromise: Promise<void> | null = null;

const PAYROLL_EMPLOYEE_PROJECTION = {
	firstName: 1,
	lastName: 1,
	workspaceId: 1,
	email: 1,
	jobTitle: 1,
	employeeCode: 1,
	payType: 1,
	payRateCents: 1,
	deductions: 1,
	workScheduleId: 1,
	isActive: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function mapEmployeeDeductions(
	input: CreatePayrollEmployeeInput['deductions'],
	currency: Parameters<typeof dollarsToCents>[1]
): PayrollEmployeeDeduction[] {
	return input
		.filter((deduction) => deduction.enabled)
		.map((deduction) => ({
			typeId: deduction.typeId,
			amountCents:
				deduction.amount > 0 ? dollarsToCents(deduction.amount, currency) : null,
			rateBasisPoints:
				deduction.ratePercent > 0 ? percentToBasisPoints(deduction.ratePercent) : null,
			isActive: true
		}));
}

function buildEmployeeWriteFields(
	data: CreatePayrollEmployeeInput,
	currency: Parameters<typeof dollarsToCents>[1],
	workScheduleId: ObjectId | null
) {
	const email = data.email?.trim() ? data.email.trim().toLowerCase() : null;
	const jobTitle = data.jobTitle?.trim() ? data.jobTitle.trim() : null;
	const employeeCode = data.employeeCode?.trim() ? data.employeeCode.trim() : null;

	return {
		firstName: data.firstName.trim(),
		lastName: data.lastName.trim(),
		email,
		jobTitle,
		employeeCode,
		payType: data.payType,
		payRateCents: dollarsToCents(data.payRate, currency),
		deductions: mapEmployeeDeductions(data.deductions, currency),
		workScheduleId
	};
}

export function isDuplicatePayrollEmployeeCodeError(error: unknown): boolean {
	return error instanceof MongoServerError && error.code === 11000;
}

function toPayrollEmployeeDto(
	doc: PayrollEmployeeDocument,
	workScheduleName: string | null = null
): PayrollEmployeeDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		firstName: doc.firstName,
		lastName: doc.lastName,
		fullName: `${doc.firstName} ${doc.lastName}`.trim(),
		email: doc.email,
		jobTitle: doc.jobTitle,
		employeeCode: doc.employeeCode ?? null,
		payType: normalizePayrollPayType(doc.payType),
		payRateCents: doc.payRateCents,
		deductions: doc.deductions ?? [],
		workScheduleId: doc.workScheduleId?.toString() ?? null,
		workScheduleName,
		isActive: doc.isActive,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

export async function ensurePayrollEmployeeIndexes(): Promise<void> {
	if (!payrollEmployeeIndexesPromise) {
		payrollEmployeeIndexesPromise = (async () => {
			const collection = await getPayrollEmployeesCollection();
			await collection.createIndex({ workspaceId: 1, lastName: 1, firstName: 1 });
			await collection.createIndex({ workspaceId: 1, isActive: 1, createdAt: -1 });
			await collection.createIndex(
				{ workspaceId: 1, employeeCode: 1 },
				{
					unique: true,
					partialFilterExpression: { employeeCode: { $type: 'string' } }
				}
			);
		})();
	}

	await payrollEmployeeIndexesPromise;
}

export async function listPayrollEmployeesForWorkspace(input: {
	workspaceId: string;
	page: number;
	limit: number;
}): Promise<{ items: PayrollEmployeeDto[]; total: number }> {
	await ensurePayrollEmployeeIndexes();

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const skip = (input.page - 1) * input.limit;
	const filter = { workspaceId: workspaceObjectId, isActive: true };

	const [items, total] = await Promise.all([
		collection
			.find(filter, { projection: PAYROLL_EMPLOYEE_PROJECTION })
			.sort({ lastName: 1, firstName: 1 })
			.skip(skip)
			.limit(input.limit)
			.toArray(),
		collection.countDocuments(filter)
	]);

	const scheduleNames = await loadWorkScheduleNamesForEmployees(input.workspaceId, items);

	return {
		items: items.map((item) =>
			toPayrollEmployeeDto(item, scheduleNames.get(item.workScheduleId?.toString() ?? '') ?? null)
		),
		total
	};
}

export async function countPayrollEmployeesForWorkspace(workspaceId: string): Promise<number> {
	await ensurePayrollEmployeeIndexes();

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	return collection.countDocuments({
		workspaceId: new ObjectId(workspaceId),
		isActive: true
	});
}

export async function createPayrollEmployeeForWorkspace(input: {
	workspaceId: string;
	data: CreatePayrollEmployeeInput;
	currency: Parameters<typeof dollarsToCents>[1];
}): Promise<PayrollEmployeeDto> {
	await ensurePayrollEmployeeIndexes();

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	const now = new Date();
	const workScheduleId = await resolveWorkScheduleObjectId(
		input.workspaceId,
		input.data.workScheduleId
	);
	const fields = buildEmployeeWriteFields(input.data, input.currency, workScheduleId);

	const result = await collection.insertOne({
		workspaceId: new ObjectId(input.workspaceId),
		...fields,
		isActive: true,
		createdAt: now,
		updatedAt: now
	} as PayrollEmployeeDocument);

	const created = await collection.findOne(
		{ _id: result.insertedId },
		{ projection: PAYROLL_EMPLOYEE_PROJECTION }
	);

	if (!created) {
		throw new Error('Failed to load created payroll employee');
	}

	const workScheduleName = workScheduleId
		? ((await getDtrWorkScheduleForWorkspace({
				workspaceId: input.workspaceId,
				scheduleId: workScheduleId.toString()
			}))?.name ?? null)
		: null;

	return toPayrollEmployeeDto(created, workScheduleName);
}

async function resolveWorkScheduleObjectId(
	workspaceId: string,
	workScheduleId: string | undefined
): Promise<ObjectId | null> {
	const scheduleId = workScheduleId?.trim();

	if (!scheduleId) {
		return null;
	}

	const schedule = await getDtrWorkScheduleForWorkspace({
		workspaceId,
		scheduleId
	});

	if (!schedule) {
		throw new Error('Invalid work schedule');
	}

	return new ObjectId(schedule.id);
}

async function loadWorkScheduleNamesForEmployees(
	workspaceId: string,
	employees: PayrollEmployeeDocument[]
): Promise<Map<string, string>> {
	const scheduleIds = [...new Set(
		employees
			.map((employee) => employee.workScheduleId?.toString())
			.filter((scheduleId): scheduleId is string => Boolean(scheduleId))
	)];

	if (scheduleIds.length === 0) {
		return new Map();
	}

	const names = new Map<string, string>();

	for (const scheduleId of scheduleIds) {
		const schedule = await getDtrWorkScheduleForWorkspace({
			workspaceId,
			scheduleId
		});

		if (schedule) {
			names.set(scheduleId, schedule.name);
		}
	}

	return names;
}

export async function getPayrollEmployeeForWorkspace(input: {
	workspaceId: string;
	employeeId: string;
}): Promise<PayrollEmployeeDto | null> {
	await ensurePayrollEmployeeIndexes();

	if (!ObjectId.isValid(input.employeeId)) {
		return null;
	}

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	const employee = await collection.findOne(
		{
			_id: new ObjectId(input.employeeId),
			workspaceId: new ObjectId(input.workspaceId),
			isActive: true
		},
		{ projection: PAYROLL_EMPLOYEE_PROJECTION }
	);

	if (!employee) {
		return null;
	}

	const workScheduleName = employee.workScheduleId
		? ((await getDtrWorkScheduleForWorkspace({
				workspaceId: input.workspaceId,
				scheduleId: employee.workScheduleId.toString()
			}))?.name ?? null)
		: null;

	return toPayrollEmployeeDto(employee, workScheduleName);
}

export async function updatePayrollEmployeeForWorkspace(input: {
	workspaceId: string;
	employeeId: string;
	data: CreatePayrollEmployeeInput;
	currency: Parameters<typeof dollarsToCents>[1];
}): Promise<PayrollEmployeeDto | null> {
	await ensurePayrollEmployeeIndexes();

	if (!ObjectId.isValid(input.employeeId)) {
		return null;
	}

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	const workScheduleId = await resolveWorkScheduleObjectId(
		input.workspaceId,
		input.data.workScheduleId
	);
	const fields = buildEmployeeWriteFields(input.data, input.currency, workScheduleId);
	const now = new Date();

	const updated = await collection.findOneAndUpdate(
		{
			_id: new ObjectId(input.employeeId),
			workspaceId: new ObjectId(input.workspaceId),
			isActive: true
		},
		{
			$set: {
				...fields,
				updatedAt: now
			}
		},
		{
			projection: PAYROLL_EMPLOYEE_PROJECTION,
			returnDocument: 'after'
		}
	);

	if (!updated) {
		return null;
	}

	const workScheduleName = updated.workScheduleId
		? ((await getDtrWorkScheduleForWorkspace({
				workspaceId: input.workspaceId,
				scheduleId: updated.workScheduleId.toString()
			}))?.name ?? null)
		: null;

	return toPayrollEmployeeDto(updated, workScheduleName);
}

export async function deactivatePayrollEmployeeForWorkspace(input: {
	workspaceId: string;
	employeeId: string;
}): Promise<boolean> {
	await ensurePayrollEmployeeIndexes();

	if (!ObjectId.isValid(input.employeeId)) {
		return false;
	}

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	const result = await collection.updateOne(
		{
			_id: new ObjectId(input.employeeId),
			workspaceId: new ObjectId(input.workspaceId),
			isActive: true
		},
		{
			$set: {
				isActive: false,
				updatedAt: new Date()
			}
		}
	);

	return result.matchedCount === 1;
}
