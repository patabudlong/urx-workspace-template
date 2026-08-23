import type { ObjectId } from 'mongodb';
import type {
	DtrHolidayCategoryRates,
	DtrHolidayEntry,
	DtrHolidayCalendarRates
} from '$lib/shared/dtr/holidays';

export type DtrHolidayCalendarDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	year: number;
	title: string;
	regularHoliday: DtrHolidayCategoryRates;
	specialNonWorkingDay: DtrHolidayCategoryRates;
	specialWorkingDay: DtrHolidayCategoryRates;
	holidays: DtrHolidayEntry[];
	createdAt: Date;
	updatedAt: Date;
};

export type DtrHolidayCalendarDto = {
	id: string;
	workspaceId: string;
	year: number;
	title: string;
	rates: DtrHolidayCalendarRates;
	holidays: DtrHolidayEntry[];
	createdAt: string;
	updatedAt: string;
};
