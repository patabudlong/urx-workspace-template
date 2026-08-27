import type { AccountingPeriodDocument, AccountingPeriodDto } from '$lib/shared/models/accounting-period';
import { getAccountingPeriodsCollection } from '$lib/server/db/collections';
import { validateAccountingPeriodClose } from '$lib/server/accounting/period-close-validation';
import { ObjectId } from 'mongodb';

export class AccountingPeriodActionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AccountingPeriodActionError';
	}
}

const PERIOD_PROJECTION = {
	_id: 1,
	workspaceId: 1,
	year: 1,
	month: 1,
	label: 1,
	status: 1,
	startDate: 1,
	endDate: 1
} as const;

function toPeriodDto(doc: AccountingPeriodDocument): AccountingPeriodDto {
	return {
		id: doc._id.toString(),
		workspaceId: doc.workspaceId.toString(),
		year: doc.year,
		month: doc.month,
		label: doc.label,
		status: doc.status,
		startDate: doc.startDate,
		endDate: doc.endDate
	};
}

export async function listAccountingPeriodsForWorkspace(
	workspaceId: string
): Promise<AccountingPeriodDto[]> {
	const collection = await getAccountingPeriodsCollection<AccountingPeriodDocument>();
	const docs = await collection
		.find({ workspaceId: new ObjectId(workspaceId) }, { projection: PERIOD_PROJECTION })
		.sort({ year: 1, month: 1 })
		.toArray();

	return docs.map(toPeriodDto);
}

export async function getAccountingPeriodForWorkspace(input: {
	workspaceId: string;
	periodId: string;
}): Promise<AccountingPeriodDto | null> {
	const collection = await getAccountingPeriodsCollection<AccountingPeriodDocument>();
	const doc = await collection.findOne(
		{
			_id: new ObjectId(input.periodId),
			workspaceId: new ObjectId(input.workspaceId)
		},
		{ projection: PERIOD_PROJECTION }
	);

	return doc ? toPeriodDto(doc) : null;
}

export async function closeAccountingPeriodForWorkspace(input: {
	workspaceId: string;
	periodId: string;
}): Promise<AccountingPeriodDto> {
	const validation = await validateAccountingPeriodClose(input);

	if (!validation.ok) {
		throw new AccountingPeriodActionError(validation.message);
	}

	const collection = await getAccountingPeriodsCollection<AccountingPeriodDocument>();
	const result = await collection.findOneAndUpdate(
		{
			_id: new ObjectId(input.periodId),
			workspaceId: new ObjectId(input.workspaceId),
			status: 'open'
		},
		{
			$set: {
				status: 'closed',
				updatedAt: new Date()
			}
		},
		{ returnDocument: 'after', projection: PERIOD_PROJECTION }
	);

	if (!result) {
		throw new AccountingPeriodActionError('Could not close fiscal period.');
	}

	return toPeriodDto(result);
}

export async function reopenAccountingPeriodForWorkspace(input: {
	workspaceId: string;
	periodId: string;
}): Promise<AccountingPeriodDto> {
	const period = await getAccountingPeriodForWorkspace(input);

	if (!period) {
		throw new AccountingPeriodActionError('Fiscal period not found.');
	}

	if (period.status !== 'closed') {
		throw new AccountingPeriodActionError(
			period.status === 'locked'
				? 'Locked periods cannot be reopened.'
				: 'Only closed periods can be reopened.'
		);
	}

	const collection = await getAccountingPeriodsCollection<AccountingPeriodDocument>();
	const result = await collection.findOneAndUpdate(
		{
			_id: new ObjectId(input.periodId),
			workspaceId: new ObjectId(input.workspaceId),
			status: 'closed'
		},
		{
			$set: {
				status: 'open',
				updatedAt: new Date()
			}
		},
		{ returnDocument: 'after', projection: PERIOD_PROJECTION }
	);

	if (!result) {
		throw new AccountingPeriodActionError('Could not reopen fiscal period.');
	}

	return toPeriodDto(result);
}

export async function lockAccountingPeriodForWorkspace(input: {
	workspaceId: string;
	periodId: string;
}): Promise<AccountingPeriodDto | null> {
	const collection = await getAccountingPeriodsCollection<AccountingPeriodDocument>();
	const result = await collection.findOneAndUpdate(
		{
			_id: new ObjectId(input.periodId),
			workspaceId: new ObjectId(input.workspaceId),
			status: 'closed'
		},
		{
			$set: {
				status: 'locked',
				updatedAt: new Date()
			}
		},
		{ returnDocument: 'after', projection: PERIOD_PROJECTION }
	);

	return result ? toPeriodDto(result) : null;
}

export async function getFirstFiscalPeriodForWorkspace(
	workspaceId: string
): Promise<AccountingPeriodDto | null> {
	const collection = await getAccountingPeriodsCollection<AccountingPeriodDocument>();
	const doc = await collection.findOne(
		{ workspaceId: new ObjectId(workspaceId) },
		{
			projection: PERIOD_PROJECTION,
			sort: { year: 1, month: 1 }
		}
	);

	return doc ? toPeriodDto(doc) : null;
}

export async function countOpenAccountingPeriodsForWorkspace(workspaceId: string): Promise<number> {
	const collection = await getAccountingPeriodsCollection();
	return collection.countDocuments({
		workspaceId: new ObjectId(workspaceId),
		status: 'open'
	});
}
