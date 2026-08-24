import type { ElementTourStep } from '$lib/components/onboarding/onboarding-element-tour.svelte';

export const PAYROLL_TOUR_STORAGE_KEY = 'urx-payroll-module-tour-dismissed';

export const PAYROLL_TOUR_STEPS: ElementTourStep[] = [
	{
		placement: 'center',
		title: 'Welcome to Payroll',
		description:
			'Set up your pay schedule, add employees, then create pay runs for each period. This tour walks through the main areas.'
	},
	{
		target: '[data-tour="payroll-nav"]',
		placement: 'right',
		title: 'Module navigation',
		description:
			'Move between Overview, Employees, and Pay runs. Start in Settings before your first pay run.'
	},
	{
		target: '[data-tour="payroll-settings"]',
		placement: 'right',
		title: 'Payroll settings',
		description:
			'Configure pay frequency, currency, timezone, and deduction types. Pay runs use these rules to suggest the next period.'
	},
	{
		target: '[data-tour="payroll-stats"]',
		placement: 'bottom',
		title: 'Workspace snapshot',
		description:
			'Track how many employees are on payroll and how many pay runs exist. Counts update as you add people and create runs.'
	},
	{
		target: '[data-tour="payroll-actions"]',
		placement: 'bottom',
		title: 'Quick actions',
		description:
			'Jump to Employees to add compensation details, or open Pay runs to start a draft period once your team is set up.'
	}
];

export function isPayrollTourDismissed(): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}

	return localStorage.getItem(PAYROLL_TOUR_STORAGE_KEY) === '1';
}

export function dismissPayrollTour(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(PAYROLL_TOUR_STORAGE_KEY, '1');
}
