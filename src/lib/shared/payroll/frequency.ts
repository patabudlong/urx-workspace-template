export const PAY_FREQUENCIES = ['weekly', 'bi-weekly', 'semi-monthly', 'monthly'] as const;

export type PayFrequency = (typeof PAY_FREQUENCIES)[number];

export const WEEK_START_DAYS = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday'
] as const;

export type WeekStartDay = (typeof WEEK_START_DAYS)[number];

export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
	weekly: 'Weekly',
	'bi-weekly': 'Bi-weekly',
	'semi-monthly': 'Semi-monthly',
	monthly: 'Monthly'
};

export const WEEK_START_DAY_LABELS: Record<WeekStartDay, string> = {
	sunday: 'Sunday',
	monday: 'Monday',
	tuesday: 'Tuesday',
	wednesday: 'Wednesday',
	thursday: 'Thursday',
	friday: 'Friday',
	saturday: 'Saturday'
};

export function requiresPeriodAnchor(frequency: PayFrequency): boolean {
	return frequency === 'weekly' || frequency === 'bi-weekly';
}
