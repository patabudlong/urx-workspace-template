import type { ObjectId } from 'mongodb';
import type { DtrApprovalStatus, DtrDaySource, DtrDayStatus } from '$lib/shared/dtr/status';
import type { DtrHolidayCategory } from '$lib/shared/dtr/holidays';

export type DtrPunch = {
	type: 'in' | 'out';
	at: string;
	source: DtrDaySource;
};

export type DtrDayDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	employeeId: ObjectId;
	date: string;
	status: DtrDayStatus;
	timeIn: string | null;
	timeOut: string | null;
	workedMinutes: number;
	source: DtrDaySource;
	approvalStatus: DtrApprovalStatus;
	notes: string | null;
	holidayCategory: DtrHolidayCategory | null;
	holidayName: string | null;
	holidayWorked: boolean | null;
	holidayPayPercent: number | null;
	createdAt: Date;
	updatedAt: Date;
};

export type DtrDayDto = {
	id: string;
	workspaceId: string;
	employeeId: string;
	date: string;
	status: DtrDayStatus;
	timeIn: string | null;
	timeOut: string | null;
	workedMinutes: number;
	source: DtrDaySource;
	approvalStatus: DtrApprovalStatus;
	notes: string | null;
	holidayCategory: DtrHolidayCategory | null;
	holidayName: string | null;
	holidayWorked: boolean | null;
	holidayPayPercent: number | null;
	createdAt: string;
	updatedAt: string;
};
