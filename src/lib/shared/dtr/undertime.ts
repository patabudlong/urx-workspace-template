import type { DtrWeekDay } from '$lib/shared/dtr/weekdays';
import { isRestDay } from '$lib/shared/dtr/weekdays';
import type { DtrDayStatus } from '$lib/shared/dtr/status';
import {
	getExpectedWorkMinutesForScheduleDate,
	isWorkScheduleRestDay
} from '$lib/shared/dtr/work-schedule';
import type { DtrWorkScheduleDto } from '$lib/shared/models/dtr-work-schedule';

export function resolveExpectedWorkMinutesForDate(input: {
	date: string;
	restDays: DtrWeekDay[];
	workSchedule?: DtrWorkScheduleDto | null;
	standardWorkMinutes: number;
}): number {
	if (input.workSchedule) {
		if (isWorkScheduleRestDay(input.workSchedule, input.date)) {
			return 0;
		}

		return getExpectedWorkMinutesForScheduleDate(input.workSchedule, input.date);
	}

	if (isRestDay(input.date, input.restDays)) {
		return 0;
	}

	return input.standardWorkMinutes > 0 ? input.standardWorkMinutes : 0;
}

export function computeUndertimeMinutes(input: {
	workedMinutes: number;
	expectedWorkMinutes: number;
	status: DtrDayStatus;
}): number {
	if (input.expectedWorkMinutes <= 0) {
		return 0;
	}

	if (input.status === 'rest' || input.status === 'pending') {
		return 0;
	}

	if (input.status === 'absent') {
		return 0;
	}

	if (input.workedMinutes >= input.expectedWorkMinutes) {
		return 0;
	}

	return input.expectedWorkMinutes - input.workedMinutes;
}

export function formatUndertimeMinutes(minutes: number): string {
	if (minutes <= 0) {
		return '0m';
	}

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	if (hours === 0) {
		return `${remainingMinutes}m`;
	}

	if (remainingMinutes === 0) {
		return `${hours}h`;
	}

	return `${hours}h ${remainingMinutes}m`;
}
