export const DTR_DAY_STATUSES = ['present', 'absent', 'rest', 'partial', 'pending'] as const;

export type DtrDayStatus = (typeof DTR_DAY_STATUSES)[number];

export const DTR_DAY_STATUS_LABELS: Record<DtrDayStatus, string> = {
	present: 'Present',
	absent: 'Absent',
	rest: 'Rest day',
	partial: 'Partial',
	pending: 'No record'
};

export const DTR_DAY_SOURCES = ['manual', 'biometric', 'online'] as const;

export type DtrDaySource = (typeof DTR_DAY_SOURCES)[number];

export const DTR_APPROVAL_STATUSES = ['draft', 'submitted', 'approved'] as const;

export type DtrApprovalStatus = (typeof DTR_APPROVAL_STATUSES)[number];
