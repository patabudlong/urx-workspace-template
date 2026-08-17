import type { PayrollRunDocument, PayrollRunDto } from '$lib/shared/models/payroll-run';
import { getPayrollRunsCollection } from '$lib/server/db/collections';
import { ObjectId } from 'mongodb';

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

export async function listPayrollRunsForWorkspace(input: {
	workspaceId: string;
	page: number;
	limit: number;
}): Promise<{ items: PayrollRunDto[]; total: number }> {
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
	const collection = await getPayrollRunsCollection<PayrollRunDocument>();
	return collection.countDocuments({ workspaceId: new ObjectId(workspaceId) });
}
