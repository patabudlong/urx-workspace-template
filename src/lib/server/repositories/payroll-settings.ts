import type {
	PayrollSettingsDocument,
	PayrollSettingsDto
} from '$lib/shared/models/payroll-settings';
import { getPayrollSettingsCollection } from '$lib/server/db/collections';
import {
	getDefaultPayrollCurrency,
	getDefaultPayrollTimezone
} from '$lib/server/payroll/config';
import type { PayrollDeductionType } from '$lib/shared/payroll/deductions';
import { normalizePayrollDeductionTypes } from '$lib/shared/payroll/deductions';
import type { PayrollJobTitle } from '$lib/shared/payroll/job-titles';
import { normalizePayrollJobTitles } from '$lib/shared/payroll/job-titles';
import type { PayrollSettingsInput } from '$lib/shared/payroll/schemas';
import {
	createPayrollSettingsDefaults,
	mapDeductionTypesToFormInput,
	mapJobTitlesToFormInput,
	type PayrollDeductionTypesInput,
	type PayrollJobTitlesInput
} from '$lib/shared/payroll/schemas';
import { resolvePayrollCurrency } from '$lib/shared/payroll/currency';
import type { PayrollCurrency } from '$lib/shared/payroll/currency';
import { normalizePayrollTimezone, resolvePayrollTimezone } from '$lib/shared/payroll/timezone';
import { ObjectId } from 'mongodb';

let payrollSettingsIndexesPromise: Promise<void> | null = null;

const PAYROLL_SETTINGS_PROJECTION = {
	workspaceId: 1,
	payFrequency: 1,
	timezone: 1,
	currency: 1,
	weekStartDay: 1,
	periodAnchorDate: 1,
	registeredCompanyName: 1,
	showYtdTotals: 1,
	deductionTypes: 1,
	jobTitles: 1,
	updatedAt: 1
} as const;

function toPayrollSettingsDto(
	doc: PayrollSettingsDocument | null,
	workspaceId: string
): PayrollSettingsDto {
	if (!doc) {
		const defaults = createPayrollSettingsDefaults({
			timezone: getDefaultPayrollTimezone(),
			currency: getDefaultPayrollCurrency()
		});

		return {
			workspaceId,
			payFrequency: defaults.payFrequency,
			timezone: defaults.timezone,
			currency: defaults.currency,
			weekStartDay: defaults.weekStartDay || null,
			periodAnchorDate: defaults.periodAnchorDate || null,
			registeredCompanyName: null,
			showYtdTotals: false,
			deductionTypes: [],
			jobTitles: [],
			configured: false,
			updatedAt: null
		};
	}

	return {
		workspaceId: doc.workspaceId.toString(),
		payFrequency: doc.payFrequency,
		timezone: resolvePayrollTimezone(doc.timezone, getDefaultPayrollTimezone()),
		currency: resolvePayrollCurrency(doc.currency ?? getDefaultPayrollCurrency()),
		weekStartDay: doc.weekStartDay,
		periodAnchorDate: doc.periodAnchorDate,
		registeredCompanyName: doc.registeredCompanyName ?? null,
		showYtdTotals: doc.showYtdTotals === true,
		deductionTypes: normalizePayrollDeductionTypes(doc.deductionTypes),
		jobTitles: normalizePayrollJobTitles(doc.jobTitles),
		configured: true,
		updatedAt: doc.updatedAt.toISOString()
	};
}

export async function ensurePayrollSettingsIndexes(): Promise<void> {
	if (!payrollSettingsIndexesPromise) {
		payrollSettingsIndexesPromise = (async () => {
			const collection = await getPayrollSettingsCollection();
			await collection.createIndex({ workspaceId: 1 }, { unique: true });
		})();
	}

	await payrollSettingsIndexesPromise;
}

export async function getPayrollSettingsForWorkspace(
	workspaceId: string
): Promise<PayrollSettingsDto> {
	await ensurePayrollSettingsIndexes();

	const collection = await getPayrollSettingsCollection<PayrollSettingsDocument>();
	const doc = await collection.findOne(
		{ workspaceId: new ObjectId(workspaceId) },
		{ projection: PAYROLL_SETTINGS_PROJECTION }
	);

	return toPayrollSettingsDto(doc, workspaceId);
}

export async function upsertPayrollSettingsForWorkspace(input: {
	workspaceId: string;
	data: PayrollSettingsInput;
}): Promise<PayrollSettingsDto> {
	await ensurePayrollSettingsIndexes();

	const collection = await getPayrollSettingsCollection<PayrollSettingsDocument>();
	const now = new Date();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const requiresAnchor =
		input.data.payFrequency === 'weekly' || input.data.payFrequency === 'bi-weekly';

	await collection.updateOne(
		{ workspaceId: workspaceObjectId },
		{
			$set: {
				payFrequency: input.data.payFrequency,
				timezone: resolvePayrollTimezone(normalizePayrollTimezone(input.data.timezone)),
				currency: resolvePayrollCurrency(input.data.currency),
				weekStartDay: requiresAnchor ? input.data.weekStartDay || null : null,
				periodAnchorDate: requiresAnchor ? input.data.periodAnchorDate || null : null,
				registeredCompanyName: input.data.registeredCompanyName?.trim() || null,
				showYtdTotals: input.data.showYtdTotals === true,
				updatedAt: now
			},
			$setOnInsert: {
				workspaceId: workspaceObjectId,
				deductionTypes: [],
				jobTitles: [],
				createdAt: now
			}
		},
		{ upsert: true }
	);

	return getPayrollSettingsForWorkspace(input.workspaceId);
}

export async function savePayrollDeductionTypesForWorkspace(input: {
	workspaceId: string;
	types: PayrollDeductionType[];
}): Promise<PayrollSettingsDto> {
	await ensurePayrollSettingsIndexes();

	const collection = await getPayrollSettingsCollection<PayrollSettingsDocument>();
	const now = new Date();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const deductionTypes = normalizePayrollDeductionTypes(input.types);

	await collection.updateOne(
		{ workspaceId: workspaceObjectId },
		{
			$set: {
				deductionTypes,
				updatedAt: now
			},
			$setOnInsert: {
				workspaceId: workspaceObjectId,
				payFrequency: 'semi-monthly',
				timezone: getDefaultPayrollTimezone(),
				currency: getDefaultPayrollCurrency(),
				weekStartDay: null,
				periodAnchorDate: null,
				jobTitles: [],
				createdAt: now
			}
		},
		{ upsert: true }
	);

	return getPayrollSettingsForWorkspace(input.workspaceId);
}

export function getPayrollDeductionTypesFormDefaults(
	types: PayrollDeductionType[]
): PayrollDeductionTypesInput {
	return {
		types: mapDeductionTypesToFormInput(types)
	};
}

export async function savePayrollJobTitlesForWorkspace(input: {
	workspaceId: string;
	titles: PayrollJobTitle[];
}): Promise<PayrollSettingsDto> {
	await ensurePayrollSettingsIndexes();

	const collection = await getPayrollSettingsCollection<PayrollSettingsDocument>();
	const now = new Date();
	const workspaceObjectId = new ObjectId(input.workspaceId);
	const jobTitles = normalizePayrollJobTitles(input.titles);

	await collection.updateOne(
		{ workspaceId: workspaceObjectId },
		{
			$set: {
				jobTitles,
				updatedAt: now
			},
			$setOnInsert: {
				workspaceId: workspaceObjectId,
				payFrequency: 'semi-monthly',
				timezone: getDefaultPayrollTimezone(),
				currency: getDefaultPayrollCurrency(),
				weekStartDay: null,
				periodAnchorDate: null,
				deductionTypes: [],
				createdAt: now
			}
		},
		{ upsert: true }
	);

	return getPayrollSettingsForWorkspace(input.workspaceId);
}

export function getPayrollJobTitlesFormDefaults(
	titles: PayrollJobTitle[],
	currency: PayrollCurrency
): PayrollJobTitlesInput {
	return {
		titles: mapJobTitlesToFormInput(titles, currency)
	};
}
