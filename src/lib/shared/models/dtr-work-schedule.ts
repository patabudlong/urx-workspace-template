import type { ObjectId } from 'mongodb';
import type { DtrWeekDay } from '$lib/shared/dtr/weekdays';

export type DtrWorkScheduleDayKind = 'rest' | 'work';

export type DtrWorkScheduleDay = {
	day: DtrWeekDay;
	kind: DtrWorkScheduleDayKind;
	startTime: string | null;
	endTime: string | null;
};

export type DtrLunchBreak = {
	startTime: string;
	endTime: string;
};

export type DtrWorkScheduleDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	name: string;
	days: DtrWorkScheduleDay[];
	lunchBreakStart: string | null;
	lunchBreakEnd: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type DtrWorkScheduleDto = {
	id: string;
	workspaceId: string;
	name: string;
	days: DtrWorkScheduleDay[];
	lunchBreak: DtrLunchBreak | null;
	createdAt: string;
	updatedAt: string;
};
