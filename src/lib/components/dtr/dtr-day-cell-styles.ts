import type { DtrDayStatus } from '$lib/shared/dtr/status';

export const DTR_DAY_STATUS_CELL_CLASSES: Record<DtrDayStatus, string> = {
	present:
		'bg-emerald-500/15 text-emerald-700 border border-emerald-500/25 dark:text-emerald-300',
	absent: 'bg-destructive/15 text-destructive border border-destructive/25',
	rest: 'bg-muted/80 text-muted-foreground border border-border/60',
	partial:
		'bg-amber-500/15 text-amber-700 border border-amber-500/25 dark:text-amber-300',
	pending:
		'bg-background text-muted-foreground border border-dashed border-border/80'
};

export const DTR_DAY_HOLIDAY_CELL_CLASSES =
	'bg-violet-500/20 text-violet-800 border border-violet-500/30 dark:text-violet-200';

export const DTR_DAY_LOCKED_CELL_CLASSES =
	'ring-1 ring-inset ring-foreground/10 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-background/25';
