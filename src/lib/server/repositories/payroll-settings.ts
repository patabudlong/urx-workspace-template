import type {
	PayrollSettingsDocument,
	PayrollSettingsDto
} from '$lib/shared/models/payroll-settings';
import { getPayrollSettingsCollection } from '$lib/server/db/collections';
import {
	getDefaultPayrollCurrency,
	getDefaultPayrollTimezone
} from '$lib/server/payroll/config';
import type { PayrollSettingsInput } from '$lib/shared/payroll/schemas';
import { createPayrollSettingsDefaults } from '$lib/shared/payroll/schemas';
import { resolvePayrollCurrency } from '$lib/shared/payroll/currency';
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
				updatedAt: now
			},
			$setOnInsert: {
				workspaceId: workspaceObjectId,
				createdAt: now
			}
		},
		{ upsert: true }
	);

	return getPayrollSettingsForWorkspace(input.workspaceId);
}
