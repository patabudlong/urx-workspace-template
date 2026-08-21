export const PAYROLL_TIMEZONES = [
	{ value: 'Asia/Manila', label: 'Philippines — Asia/Manila (PHT)' },
	{ value: 'UTC', label: 'UTC' },
	{ value: 'Asia/Singapore', label: 'Singapore — Asia/Singapore' },
	{ value: 'Asia/Tokyo', label: 'Japan — Asia/Tokyo' },
	{ value: 'Asia/Hong_Kong', label: 'Hong Kong — Asia/Hong_Kong' },
	{ value: 'Asia/Seoul', label: 'South Korea — Asia/Seoul' },
	{ value: 'Asia/Kolkata', label: 'India — Asia/Kolkata' },
	{ value: 'Asia/Dubai', label: 'UAE — Asia/Dubai' },
	{ value: 'Europe/London', label: 'United Kingdom — Europe/London' },
	{ value: 'Europe/Paris', label: 'Central Europe — Europe/Paris' },
	{ value: 'Europe/Berlin', label: 'Germany — Europe/Berlin' },
	{ value: 'America/New_York', label: 'US Eastern — America/New_York' },
	{ value: 'America/Chicago', label: 'US Central — America/Chicago' },
	{ value: 'America/Denver', label: 'US Mountain — America/Denver' },
	{ value: 'America/Los_Angeles', label: 'US Pacific — America/Los_Angeles' },
	{ value: 'America/Toronto', label: 'Canada Eastern — America/Toronto' },
	{ value: 'America/Vancouver', label: 'Canada Pacific — America/Vancouver' },
	{ value: 'Australia/Sydney', label: 'Australia — Australia/Sydney' },
	{ value: 'Pacific/Auckland', label: 'New Zealand — Pacific/Auckland' }
] as const;

export const PAYROLL_TIMEZONE_VALUES = PAYROLL_TIMEZONES.map((timezone) => timezone.value);

export type PayrollTimezone = (typeof PAYROLL_TIMEZONE_VALUES)[number];

export const DEFAULT_PAYROLL_TIMEZONE: PayrollTimezone = 'Asia/Manila';

const PAYROLL_TIMEZONE_SET = new Set<string>(PAYROLL_TIMEZONE_VALUES);

const PAYROLL_TIMEZONE_ALIASES: Record<string, PayrollTimezone> = {
	pht: 'Asia/Manila',
	ph: 'Asia/Manila',
	philippines: 'Asia/Manila',
	est: 'America/New_York',
	edt: 'America/New_York',
	cst: 'America/Chicago',
	cdt: 'America/Chicago',
	mst: 'America/Denver',
	mdt: 'America/Denver',
	pst: 'America/Los_Angeles',
	pdt: 'America/Los_Angeles',
	gmt: 'UTC',
	utc: 'UTC'
};

export function isAcceptedPayrollTimezone(value: string): value is PayrollTimezone {
	return PAYROLL_TIMEZONE_SET.has(value);
}

export function normalizePayrollTimezone(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return trimmed;
	}

	const alias = PAYROLL_TIMEZONE_ALIASES[trimmed.toLowerCase()];
	if (alias) {
		return alias;
	}

	return trimmed;
}

/** Map legacy or alias values to an accepted payroll timezone. */
export function resolvePayrollTimezone(
	value: string,
	fallback: PayrollTimezone = DEFAULT_PAYROLL_TIMEZONE
): PayrollTimezone {
	const normalized = normalizePayrollTimezone(value);
	if (isAcceptedPayrollTimezone(normalized)) {
		return normalized;
	}

	return fallback;
}

export function getPayrollTimezoneLabel(value: PayrollTimezone): string {
	return PAYROLL_TIMEZONES.find((timezone) => timezone.value === value)?.label ?? value;
}
