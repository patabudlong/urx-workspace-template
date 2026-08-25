import type { DtrHolidayCategory } from '$lib/shared/dtr/holidays';

export const DTR_HOLIDAY_CATEGORY_BADGE_CLASSES: Record<DtrHolidayCategory, string> = {
	regular:
		'bg-violet-500/15 text-violet-800 border border-violet-500/25 dark:text-violet-200',
	special_non_working:
		'bg-amber-500/15 text-amber-700 border border-amber-500/25 dark:text-amber-300',
	special_working:
		'bg-sky-500/15 text-sky-700 border border-sky-500/25 dark:text-sky-300'
};

export const DTR_HOLIDAY_CATEGORY_CARD_CLASSES: Record<DtrHolidayCategory, string> = {
	regular: 'border-violet-500/20 bg-violet-500/5',
	special_non_working: 'border-amber-500/20 bg-amber-500/5',
	special_working: 'border-sky-500/20 bg-sky-500/5'
};
