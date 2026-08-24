import type { DtrDayStatus } from '$lib/shared/dtr/status';

export const DTR_NG_IMPORT_PREVIEW_COOKIE = 'dtr_ng_import_preview';
export const DTR_NG_IMPORT_PREVIEW_MAX_AGE_SECONDS = 300;

export const NG_TIMECARD_ACCEPT =
	'.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const NG_TIMECARD_MAX_BYTES = 5 * 1024 * 1024;

export type DtrNgImportPreviewRow = {
	employeeId: string;
	employeeName: string;
	employeeCode: string;
	fileEmployeeName: string;
	date: string;
	status: DtrDayStatus;
	timeIn: string | null;
	timeOut: string | null;
	morningTimeIn: string | null;
	morningTimeOut: string | null;
	afternoonTimeIn: string | null;
	afternoonTimeOut: string | null;
	notes: string | null;
};

export type DtrNgImportPreview = {
	workspaceId: string;
	payPeriodStart: string;
	payPeriodEnd: string;
	employeeCount: number;
	rows: DtrNgImportPreviewRow[];
	warnings: string[];
	skippedCount: number;
};

export function formatDtrNgImportTimeRange(timeIn: string | null, timeOut: string | null): string {
	if (!timeIn && !timeOut) {
		return '—';
	}

	return `${timeIn ?? '—'} → ${timeOut ?? '—'}`;
}

export function formatDtrNgImportDayTimes(row: {
	timeIn?: string | null;
	timeOut?: string | null;
	morningTimeIn?: string | null;
	morningTimeOut?: string | null;
	afternoonTimeIn?: string | null;
	afternoonTimeOut?: string | null;
}): string {
	const morning = formatDtrNgImportTimeRange(row.morningTimeIn ?? null, row.morningTimeOut ?? null);
	const afternoon = formatDtrNgImportTimeRange(
		row.afternoonTimeIn ?? null,
		row.afternoonTimeOut ?? null
	);
	const parts: string[] = [];

	if (morning !== '—') {
		parts.push(`AM ${morning}`);
	}

	if (afternoon !== '—') {
		parts.push(`PM ${afternoon}`);
	}

	if (parts.length > 0) {
		return parts.join(' · ');
	}

	return formatDtrNgImportTimeRange(row.timeIn ?? null, row.timeOut ?? null);
}
