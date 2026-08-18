import type { ObjectId } from 'mongodb';
import type { DtrWeekDay } from '$lib/shared/dtr/weekdays';

export type DtrSettingsDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	restDays: DtrWeekDay[];
	standardWorkMinutes: number;
	createdAt: Date;
	updatedAt: Date;
};

export type DtrSettingsDto = {
	workspaceId: string;
	restDays: DtrWeekDay[];
	standardWorkMinutes: number;
	configured: boolean;
	updatedAt: string | null;
};
