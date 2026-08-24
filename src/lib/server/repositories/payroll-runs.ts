import type { PayrollRunDocument, PayrollRunDto } from '$lib/shared/models/payroll-run';
import { getPayrollRunsCollection } from '$lib/server/db/collections';
import { unlockDtrDaysForPayRun } from '$lib/server/repositories/dtr-days';
import { deletePayrollPayslipsForRun } from '$lib/server/repositories/payroll-payslips';
import type { CreatePayrollRunInput } from '$lib/shared/payroll/schemas';
import { ObjectId } from 'mongodb';

let payrollRunIndexesPromise: Promise<void> | null = null;

const PAYROLL_RUN_PROJECTION = {
	title: 1,
	workspaceId: 1,
	periodStart: 1,
	periodEnd: 1,
	status: 1,
	createdAt: 1,
	updatedAt: 1
} as const;

function toPayrollRunDto(
	doc: PayrollRunDocument,
	payslipCount?: number
): PayrollRunDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		title: doc.title,
		periodStart: doc.periodStart.toISOString(),
		periodEnd: doc.periodEnd.toISOString(),
		status: doc.status,
		...(payslipCount != null ? { payslipCount } : {}),
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString()
	};
}

function parsePayrollDate(value: string): Date {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day));
}

export async function ensurePayrollRunIndexes(): Promise<void> {
	if (!payrollRunIndexesPromise) {
		payrollRunIndexesPromise = (async () => {
			const collection = await getPayrollRunsCollection();
			await collection.createIndex({ workspaceId: 1, periodEnd: -1, createdAt: -1 });
			await collection.createIndex({ workspaceId: 1, status: 1, periodEnd: -1 });
		})();
	}

	await payrollRunIndexesPromise;
}

export async function listPayrollRunsForWorkspace(input: {
	workspaceId: string;
	page: number;
	limit: number;
}): Promise<{ items: PayrollRunDto[]; total: number }> {
	await ensurePayrollRunIndexes();

	const collection = await getPayrollRunsCollection<PayrollRunDocument>();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const skip = (input.page - 1) * input.limit;

	const filter = { workspaceId: workspaceObjectId };

	const [items, total] = await Promise.all([
		collection
			.find(filter, { projection: PAYROLL_RUN_PROJECTION })
			.sort({ periodEnd: -1, createdAt: -1 })
			.skip(skip)
			.limit(input.limit)
			.toArray(),
		collection.countDocuments(filter)
	]);

	return {
		items: items.map(toPayrollRunDto),
		total
	};
}

export async function countPayrollRunsForWorkspace(workspaceId: string): Promise<number> {
	await ensurePayrollRunIndexes();

	const collection = await getPayrollRunsCollection<PayrollRunDocument>();
	return collection.countDocuments({ workspaceId: new ObjectId(workspaceId) });
}

export async function getLatestPayrollRunPeriodEnd(
	workspaceId: string
): Promise<string | null> {
	await ensurePayrollRunIndexes();

	const collection = await getPayrollRunsCollection<PayrollRunDocument>();
	const latest = await collection.findOne(
		{ workspaceId: new ObjectId(workspaceId) },
		{
			projection: { periodEnd: 1 },
			sort: { periodEnd: -1, createdAt: -1 }
		}
	);

	return latest
		? `${latest.periodEnd.getUTCFullYear()}-${String(latest.periodEnd.getUTCMonth() + 1).padStart(2, '0')}-${String(latest.periodEnd.getUTCDate()).padStart(2, '0')}`
		: null;
}

export async function createPayrollRunForWorkspace(input: {
	workspaceId: string;
	data: CreatePayrollRunInput;
}): Promise<PayrollRunDto> {
	await ensurePayrollRunIndexes();

	const collection = await getPayrollRunsCollection<PayrollRunDocument>();
	const now = new Date();

	const result = await collection.insertOne({
		workspaceId: new ObjectId(input.workspaceId),
		title: input.data.title.trim(),
		periodStart: parsePayrollDate(input.data.periodStart),
		periodEnd: parsePayrollDate(input.data.periodEnd),
		status: 'draft',
		createdAt: now,
		updatedAt: now
	} as PayrollRunDocument);

	const created = await collection.findOne(
		{ _id: result.insertedId },
		{ projection: PAYROLL_RUN_PROJECTION }
	);

	if (!created) {
		throw new Error('Failed to load created payroll run');
	}

	return toPayrollRunDto(created);
}

function formatPayrollDateUtc(date: Date): string {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export async function getPayrollRunForWorkspace(input: {
	workspaceId: string;
	runId: string;
}): Promise<PayrollRunDto | null> {
	await ensurePayrollRunIndexes();

	if (!ObjectId.isValid(input.runId)) {
		return null;
	}

	const collection = await getPayrollRunsCollection<PayrollRunDocument>();
	const run = await collection.findOne(
		{
			_id: new ObjectId(input.runId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ projection: PAYROLL_RUN_PROJECTION }
	);

	return run ? toPayrollRunDto(run) : null;
}

export async function getPayrollRunDocumentForWorkspace(input: {
	workspaceId: string;
	runId: string;
}): Promise<PayrollRunDocument | null> {
	await ensurePayrollRunIndexes();

	if (!ObjectId.isValid(input.runId)) {
		return null;
	}

	const collection = await getPayrollRunsCollection<PayrollRunDocument>();
	return collection.findOne(
		{
			_id: new ObjectId(input.runId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ projection: PAYROLL_RUN_PROJECTION }
	);
}

export async function updatePayrollRunStatus(input: {
	workspaceId: string;
	runId: string;
	status: PayrollRunDocument['status'];
	expectedStatus?: PayrollRunDocument['status'];
}): Promise<PayrollRunDto | null> {
	await ensurePayrollRunIndexes();

	if (!ObjectId.isValid(input.runId)) {
		return null;
	}

	const collection = await getPayrollRunsCollection<PayrollRunDocument>();
	const filter: Record<string, unknown> = {
		_id: new ObjectId(input.runId),
		workspaceId: new ObjectId(input.workspaceId)
	};

	if (input.expectedStatus) {
		filter.status = input.expectedStatus;
	}

	const updated = await collection.findOneAndUpdate(
		filter,
		{
			$set: {
				status: input.status,
				updatedAt: new Date()
			}
		},
		{
			projection: PAYROLL_RUN_PROJECTION,
			returnDocument: 'after'
		}
	);

	return updated ? toPayrollRunDto(updated) : null;
}

export function payrollRunPeriodDates(run: PayrollRunDocument): {
	periodStart: string;
	periodEnd: string;
} {
	return {
		periodStart: formatPayrollDateUtc(run.periodStart),
		periodEnd: formatPayrollDateUtc(run.periodEnd)
	};
}

function parsePayrollDateUtc(value: string): Date {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day));
}

function listDatesInclusive(startDate: string, endDate: string): string[] {
	const dates: string[] = [];
	const start = parsePayrollDateUtc(startDate);
	const end = parsePayrollDateUtc(endDate);

	for (let current = start; current <= end; current = new Date(current.getTime() + 86_400_000)) {
		dates.push(formatPayrollDateUtc(current));
	}

	return dates;
}

export async function listCompletedPayPeriodDatesForWorkspace(input: {
	workspaceId: string;
	startDate: string;
	endDate: string;
}): Promise<Set<string>> {
	await ensurePayrollRunIndexes();

	const collection = await getPayrollRunsCollection<PayrollRunDocument>();
	const viewStart = parsePayrollDateUtc(input.startDate);
	const viewEnd = parsePayrollDateUtc(input.endDate);

	const runs = await collection
		.find(
			{
				workspaceId: new ObjectId(input.workspaceId),
				status: 'completed',
				periodStart: { $lte: viewEnd },
				periodEnd: { $gte: viewStart }
			},
			{ projection: { periodStart: 1, periodEnd: 1 } }
		)
		.toArray();

	const lockedDates = new Set<string>();

	for (const run of runs) {
		const { periodStart, periodEnd } = payrollRunPeriodDates(run);
		const overlapStart = periodStart > input.startDate ? periodStart : input.startDate;
		const overlapEnd = periodEnd < input.endDate ? periodEnd : input.endDate;

		for (const date of listDatesInclusive(overlapStart, overlapEnd)) {
			lockedDates.add(date);
		}
	}

	return lockedDates;
}

export type DeletePayrollRunResult =
	| { ok: true }
	| { ok: false; code: 'NOT_FOUND' | 'PROCESSING' | 'FAILED' };

export async function deletePayrollRunForWorkspace(input: {
	workspaceId: string;
	runId: string;
}): Promise<DeletePayrollRunResult> {
	await ensurePayrollRunIndexes();

	if (!ObjectId.isValid(input.runId)) {
		return { ok: false, code: 'NOT_FOUND' };
	}

	const run = await getPayrollRunDocumentForWorkspace({
		workspaceId: input.workspaceId,
		runId: input.runId
	});

	if (!run) {
		return { ok: false, code: 'NOT_FOUND' };
	}

	if (run.status === 'processing') {
		return { ok: false, code: 'PROCESSING' };
	}

	try {
		await deletePayrollPayslipsForRun(input.workspaceId, input.runId);
		await unlockDtrDaysForPayRun({
			workspaceId: input.workspaceId,
			runId: input.runId
		});

		const collection = await getPayrollRunsCollection<PayrollRunDocument>();
		const result = await collection.deleteOne({
			_id: new ObjectId(input.runId),
			workspaceId: new ObjectId(input.workspaceId)
		});

		if (result.deletedCount !== 1) {
			return { ok: false, code: 'FAILED' };
		}

		return { ok: true };
	} catch {
		return { ok: false, code: 'FAILED' };
	}
}
