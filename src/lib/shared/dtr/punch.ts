import { hasSplitDtrTimePunches, type DtrDayTimePunchesInput } from '$lib/shared/dtr/calendar';
import type { DtrDayDto } from '$lib/shared/models/dtr-day';
import type { DtrDayStatus } from '$lib/shared/dtr/status';

export const DTR_PUNCH_SLOTS = [
	'morningTimeIn',
	'morningTimeOut',
	'afternoonTimeIn',
	'afternoonTimeOut'
] as const;

export type DtrPunchSlot = (typeof DTR_PUNCH_SLOTS)[number];

export const DTR_PUNCH_SLOT_LABELS: Record<DtrPunchSlot, string> = {
	morningTimeIn: 'Morning in',
	morningTimeOut: 'Morning out',
	afternoonTimeIn: 'Afternoon in',
	afternoonTimeOut: 'Afternoon out'
};

export type DtrPunchAction = 'in' | 'out';

export type DtrPunchState = {
	nextSlot: DtrPunchSlot | null;
	nextAction: DtrPunchAction | null;
	isComplete: boolean;
	punches: Partial<Record<DtrPunchSlot, string>>;
};

export function formatDtrClockTime(date = new Date()): string {
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}

export function formatDtrDisplayTime(time: string | null | undefined): string {
	if (!time) {
		return '—';
	}

	const [hoursText, minutesText] = time.split(':');
	const hours = Number(hoursText);
	const minutes = Number(minutesText);
	const date = new Date();
	date.setHours(hours, minutes, 0, 0);

	return new Intl.DateTimeFormat(undefined, {
		hour: 'numeric',
		minute: '2-digit'
	}).format(date);
}

export function formatDtrCalendarDate(date: string): string {
	const [year, month, day] = date.split('-').map(Number);
	return new Intl.DateTimeFormat(undefined, {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	}).format(new Date(year, month - 1, day));
}

export function getTodayDtrDate(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function normalizePunches(record: DtrDayDto | DtrDayTimePunchesInput | null): Partial<
	Record<DtrPunchSlot, string>
> {
	if (!record) {
		return {};
	}

	if (hasSplitDtrTimePunches(record)) {
		return {
			morningTimeIn: record.morningTimeIn ?? undefined,
			morningTimeOut: record.morningTimeOut ?? undefined,
			afternoonTimeIn: record.afternoonTimeIn ?? undefined,
			afternoonTimeOut: record.afternoonTimeOut ?? undefined
		};
	}

	if (record.timeIn || record.timeOut) {
		return {
			morningTimeIn: record.timeIn ?? undefined,
			morningTimeOut: record.timeOut ?? undefined
		};
	}

	return {};
}

export function resolveDtrPunchState(record: DtrDayDto | null): DtrPunchState {
	const punches = normalizePunches(record);

	for (const slot of DTR_PUNCH_SLOTS) {
		if (!punches[slot]) {
			const nextAction: DtrPunchAction = slot.endsWith('In') ? 'in' : 'out';
			return {
				nextSlot: slot,
				nextAction,
				isComplete: false,
				punches
			};
		}
	}

	return {
		nextSlot: null,
		nextAction: null,
		isComplete: true,
		punches
	};
}

export function resolveDtrStatusAfterPunch(
	punches: Partial<Record<DtrPunchSlot, string>>
): DtrDayStatus {
	const hasMorningIn = Boolean(punches.morningTimeIn);
	const hasMorningOut = Boolean(punches.morningTimeOut);
	const hasAfternoonIn = Boolean(punches.afternoonTimeIn);
	const hasAfternoonOut = Boolean(punches.afternoonTimeOut);

	if (hasMorningIn && hasMorningOut && hasAfternoonIn && hasAfternoonOut) {
		return 'present';
	}

	if (hasMorningIn || hasMorningOut || hasAfternoonIn || hasAfternoonOut) {
		return 'partial';
	}

	return 'pending';
}

export function applyDtrPunch(input: {
	record: DtrDayDto | null;
	slot: DtrPunchSlot;
	time: string;
}): {
	morningTimeIn: string | null;
	morningTimeOut: string | null;
	afternoonTimeIn: string | null;
	afternoonTimeOut: string | null;
	status: DtrDayStatus;
} {
	const punches = { ...normalizePunches(input.record), [input.slot]: input.time };
	const status = resolveDtrStatusAfterPunch(punches);

	return {
		morningTimeIn: punches.morningTimeIn ?? null,
		morningTimeOut: punches.morningTimeOut ?? null,
		afternoonTimeIn: punches.afternoonTimeIn ?? null,
		afternoonTimeOut: punches.afternoonTimeOut ?? null,
		status
	};
}

export function summarizeDtrDayTimes(record: DtrDayDto | null): {
	morningTimeIn: string | null;
	morningTimeOut: string | null;
	afternoonTimeIn: string | null;
	afternoonTimeOut: string | null;
} {
	const punches = normalizePunches(record);

	return {
		morningTimeIn: punches.morningTimeIn ?? null,
		morningTimeOut: punches.morningTimeOut ?? null,
		afternoonTimeIn: punches.afternoonTimeIn ?? null,
		afternoonTimeOut: punches.afternoonTimeOut ?? null
	};
}
