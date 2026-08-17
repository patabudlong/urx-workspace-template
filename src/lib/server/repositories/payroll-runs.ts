import type { PayrollRunDocument, PayrollRunDto } from '$lib/shared/models/payroll-run';
import { getPayrollRunsCollection } from '$lib/server/db/collections';
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

function toPayrollRunDto(doc: PayrollRunDocument): PayrollRunDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		title: doc.title,
		periodStart: doc.periodStart.toISOString(),
		periodEnd: doc.periodEnd.toISOString(),
		status: doc.status,
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
