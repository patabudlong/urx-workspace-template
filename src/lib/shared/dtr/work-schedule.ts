import {
	computeOverlapMinutes,
	computeWorkedMinutes,
	parseTimeToMinutes
} from '$lib/shared/dtr/calendar';
import { DTR_WEEK_DAYS, DTR_WEEK_DAY_LABELS, getWeekDayFromDate } from '$lib/shared/dtr/weekdays';
import type {
	DtrLunchBreak,
	DtrWorkScheduleDay,
	DtrWorkScheduleDayKind,
	DtrWorkScheduleDto
} from '$lib/shared/models/dtr-work-schedule';

export type DtrWorkScheduleDayInput = {
	day: DtrWorkScheduleDay['day'];
	kind: DtrWorkScheduleDayKind;
	startTime?: string;
	endTime?: string;
};

export type DtrWorkScheduleInputShape = {
	id: string;
	name: string;
	days: DtrWorkScheduleDayInput[];
	lunchBreakStart?: string;
	lunchBreakEnd?: string;
};

export function createWorkScheduleId(): string {
	return `pending-${crypto.randomUUID()}`;
}

export function createDefaultWorkScheduleDays(): DtrWorkScheduleDayInput[] {
	return DTR_WEEK_DAYS.map((day) => ({
		day,
		kind: day === 'sunday' || day === 'saturday' ? 'rest' : 'work',
		startTime: '09:00',
		endTime: '17:00'
	}));
}

export function createBlankWorkScheduleInput(): DtrWorkScheduleInputShape {
	return {
		id: createWorkScheduleId(),
		name: '',
		days: createDefaultWorkScheduleDays(),
		lunchBreakStart: '12:00',
		lunchBreakEnd: '13:00'
	};
}

export function normalizeLunchBreak(input: {
	lunchBreakStart?: string | null;
	lunchBreakEnd?: string | null;
}): DtrLunchBreak | null {
	const startTime = input.lunchBreakStart?.trim() ?? '';
	const endTime = input.lunchBreakEnd?.trim() ?? '';

	if (!startTime || !endTime) {
		return null;
	}

	if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
		return null;
	}

	return { startTime, endTime };
}

export function normalizeWorkScheduleDays(
	days: DtrWorkScheduleDayInput[] | DtrWorkScheduleDay[]
): DtrWorkScheduleDay[] {
	const byDay = new Map(days.map((day) => [day.day, day]));

	return DTR_WEEK_DAYS.map((day) => {
		const entry = byDay.get(day);
		const kind: DtrWorkScheduleDayKind = entry?.kind === 'work' ? 'work' : 'rest';
		const startTime =
			kind === 'work' && entry?.startTime?.trim() ? entry.startTime.trim() : null;
		const endTime = kind === 'work' && entry?.endTime?.trim() ? entry.endTime.trim() : null;

		return {
			day,
			kind,
			startTime,
			endTime
		};
	});
}

export function toWorkScheduleDto(input: {
	id: string;
	workspaceId: string;
	name: string;
	days: DtrWorkScheduleDayInput[] | DtrWorkScheduleDay[];
	lunchBreakStart?: string | null;
	lunchBreakEnd?: string | null;
	createdAt: string;
	updatedAt: string;
}): DtrWorkScheduleDto {
	return {
		id: input.id,
		workspaceId: input.workspaceId,
		name: input.name,
		days: normalizeWorkScheduleDays(input.days),
		lunchBreak: normalizeLunchBreak(input),
		createdAt: input.createdAt,
		updatedAt: input.updatedAt
	};
}

export function getWorkScheduleDayConfig(
	schedule: DtrWorkScheduleDto,
	date: string
): DtrWorkScheduleDay | null {
	const weekday = getWeekDayFromDate(date);
	return schedule.days.find((day) => day.day === weekday) ?? null;
}

export function isWorkScheduleRestDay(schedule: DtrWorkScheduleDto, date: string): boolean {
	const dayConfig = getWorkScheduleDayConfig(schedule, date);
	return dayConfig?.kind !== 'work';
}

export function getExpectedWorkMinutesForScheduleDate(
	schedule: DtrWorkScheduleDto,
	date: string
): number {
	const dayConfig = getWorkScheduleDayConfig(schedule, date);

	if (!dayConfig || dayConfig.kind !== 'work' || !dayConfig.startTime || !dayConfig.endTime) {
		return 0;
	}

	return computeWorkedMinutes(dayConfig.startTime, dayConfig.endTime, schedule.lunchBreak);
}

export function formatLunchBreakWindow(lunchBreak: DtrLunchBreak | null): string {
	if (!lunchBreak) {
		return 'None';
	}

	return `${formatTimeLabel(lunchBreak.startTime)}–${formatTimeLabel(lunchBreak.endTime)}`;
}

export function formatWorkScheduleDayWindow(day: DtrWorkScheduleDay): string {
	if (day.kind !== 'work' || !day.startTime || !day.endTime) {
		return 'Rest';
	}

	return `${formatTimeLabel(day.startTime)}–${formatTimeLabel(day.endTime)}`;
}

export function formatWorkScheduleSummary(schedule: DtrWorkScheduleDto): string {
	return listWorkScheduleWorkDaySummaries(schedule).join(', ') || 'No work days';
}

export function listWorkScheduleWorkDaySummaries(schedule: DtrWorkScheduleDto): string[] {
	const workDays = schedule.days.filter((day) => day.kind === 'work');

	return workDays.map(
		(day) => `${DTR_WEEK_DAY_LABELS[day.day]} ${formatWorkScheduleDayWindow(day)}`
	);
}

function formatTimeLabel(time: string): string {
	const [hourText, minuteText] = time.split(':');
	const hour = Number(hourText);
	const minute = Number(minuteText);
	const period = hour >= 12 ? 'pm' : 'am';
	const hour12 = hour % 12 === 0 ? 12 : hour % 12;

	if (minute === 0) {
		return `${hour12}${period}`;
	}

	return `${hour12}:${minuteText}${period}`;
}
