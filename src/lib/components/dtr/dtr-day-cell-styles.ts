import type { DtrDayStatus } from '$lib/shared/dtr/status';

export const DTR_DAY_STATUS_CELL_CLASSES: Record<DtrDayStatus, string> = {
	present: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
	absent: 'bg-destructive/15 text-destructive',
	rest: 'bg-muted text-muted-foreground',
	partial: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
	pending: 'bg-background text-muted-foreground border border-dashed border-border'
};

export const DTR_DAY_HOLIDAY_CELL_CLASSES =
	'bg-violet-500/20 text-violet-800 dark:text-violet-200';
