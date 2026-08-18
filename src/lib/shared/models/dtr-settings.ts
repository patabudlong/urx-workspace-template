import type { ObjectId } from 'mongodb';
import type { DtrWeekDay } from '$lib/shared/dtr/weekdays';

import type { DtrLunchBreak } from '$lib/shared/models/dtr-work-schedule';

export type DtrSettingsDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	restDays: DtrWeekDay[];
	standardWorkMinutes: number;
	lunchBreakStart: string | null;
	lunchBreakEnd: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type DtrSettingsDto = {
	workspaceId: string;
	restDays: DtrWeekDay[];
	standardWorkMinutes: number;
	lunchBreak: DtrLunchBreak | null;
	configured: boolean;
	updatedAt: string | null;
};
