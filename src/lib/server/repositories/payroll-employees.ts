import type {
	PayrollEmployeeDocument,
	PayrollEmployeeDto
} from '$lib/shared/models/payroll-employee';
import { getPayrollEmployeesCollection } from '$lib/server/db/collections';
import { resolvePayrollEmployeeUserId } from '$lib/server/payroll/employee-link';
import { getDtrWorkScheduleForWorkspace } from '$lib/server/repositories/dtr-work-schedules';
import type { PayrollEmployeeDeduction } from '$lib/shared/payroll/deductions';
import { percentToBasisPoints } from '$lib/shared/payroll/deductions';
import { dollarsToCents } from '$lib/shared/payroll/format';
import { formatPayrollEmployeeFullName } from '$lib/shared/payroll/employee-name';
import type { CreatePayrollEmployeeInput } from '$lib/shared/payroll/schemas';
import { normalizePayrollPayType } from '$lib/shared/payroll/pay-rate';
import { MongoServerError, ObjectId } from 'mongodb';

let payrollEmployeeIndexesPromise: Promise<void> | null = null;

const PAYROLL_EMPLOYEE_PROJECTION = {
	firstName: 1,
	initialName: 1,
	lastName: 1,
	workspaceId: 1,
	email: 1,
	userId: 1,
	jobTitle: 1,
	employeeCode: 1,
	photoUrl: 1,
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
	const initialName = data.initialName?.trim() ? data.initialName.trim() : null;
	const jobTitle = data.jobTitle?.trim() ? data.jobTitle.trim() : null;
	const employeeCode = data.employeeCode?.trim() ? data.employeeCode.trim() : null;

	return {
		firstName: data.firstName.trim(),
		initialName,
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
		initialName: doc.initialName ?? null,
		lastName: doc.lastName,
		fullName: formatPayrollEmployeeFullName({
			firstName: doc.firstName,
			initialName: doc.initialName,
			lastName: doc.lastName
		}),
		email: doc.email,
		userId: doc.userId?.toString() ?? null,
		jobTitle: doc.jobTitle,
		employeeCode: doc.employeeCode ?? null,
		photoUrl: doc.photoUrl ?? null,
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
			await collection.createIndex(
				{ workspaceId: 1, userId: 1 },
				{
					unique: true,
					partialFilterExpression: { userId: { $type: 'objectId' } }
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
	const userId = await resolvePayrollEmployeeUserId({
		workspaceId: input.workspaceId,
		email: fields.email
	});

	const result = await collection.insertOne({
		workspaceId: new ObjectId(input.workspaceId),
		...fields,
		userId,
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

export async function findPayrollEmployeeForWorkspaceUser(input: {
	workspaceId: string;
	userId: string;
	email?: string | null;
}): Promise<PayrollEmployeeDto | null> {
	await ensurePayrollEmployeeIndexes();

	if (!ObjectId.isValid(input.userId)) {
		return null;
	}

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const userObjectId = new ObjectId(input.userId);

	const byUserId = await collection.findOne(
		{
			workspaceId: workspaceObjectId,
			userId: userObjectId,
			isActive: true
		},
		{ projection: PAYROLL_EMPLOYEE_PROJECTION }
	);

	if (byUserId) {
		const workScheduleName = byUserId.workScheduleId
			? ((await getDtrWorkScheduleForWorkspace({
					workspaceId: input.workspaceId,
					scheduleId: byUserId.workScheduleId.toString()
				}))?.name ?? null)
			: null;

		return toPayrollEmployeeDto(byUserId, workScheduleName);
	}

	if (input.email) {
		return findPayrollEmployeeByEmailForWorkspace({
			workspaceId: input.workspaceId,
			email: input.email
		});
	}

	return null;
}

export async function syncPayrollEmployeeUserLinksForWorkspace(workspaceId: string): Promise<void> {
	await ensurePayrollEmployeeIndexes();

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	const employees = await collection
		.find(
			{
				workspaceId: new ObjectId(workspaceId),
				isActive: true,
				email: { $type: 'string' }
			},
			{ projection: { email: 1 } }
		)
		.toArray();

	const now = new Date();

	for (const employee of employees) {
		if (!employee.email) {
			continue;
		}

		const userId = await resolvePayrollEmployeeUserId({
			workspaceId,
			email: employee.email
		});

		await collection.updateOne(
			{ _id: employee._id },
			{
				$set: {
					userId,
					updatedAt: now
				}
			}
		);
	}
}

export async function findPayrollEmployeeByEmailForWorkspace(input: {
	workspaceId: string;
	email: string;
}): Promise<PayrollEmployeeDto | null> {
	await ensurePayrollEmployeeIndexes();

	const email = input.email.trim().toLowerCase();

	if (!email) {
		return null;
	}

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	const employee = await collection.findOne(
		{
			workspaceId: new ObjectId(input.workspaceId),
			email,
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

export async function listActivePayrollEmployeeDocumentsForWorkspace(
	workspaceId: string
): Promise<PayrollEmployeeDocument[]> {
	await ensurePayrollEmployeeIndexes();

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	return collection
		.find(
			{ workspaceId: new ObjectId(workspaceId), isActive: true },
			{ projection: PAYROLL_EMPLOYEE_PROJECTION }
		)
		.sort({ lastName: 1, firstName: 1 })
		.toArray();
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
	const userId = await resolvePayrollEmployeeUserId({
		workspaceId: input.workspaceId,
		email: fields.email
	});
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
				userId,
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

export async function updatePayrollEmployeePhotoUrl(input: {
	workspaceId: string;
	employeeId: string;
	photoUrl: string | null;
}): Promise<PayrollEmployeeDto | null> {
	await ensurePayrollEmployeeIndexes();

	if (!ObjectId.isValid(input.employeeId)) {
		return null;
	}

	const collection = await getPayrollEmployeesCollection<PayrollEmployeeDocument>();
	const now = new Date();

	const updated = await collection.findOneAndUpdate(
		{
			_id: new ObjectId(input.employeeId),
			workspaceId: new ObjectId(input.workspaceId),
			isActive: true
		},
		{
			$set: {
				photoUrl: input.photoUrl,
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
