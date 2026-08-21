import { canManagePayroll } from '$lib/shared/payroll/access';

/** DTR management uses the same workspace roles as payroll for v1. */
export function canManageDtr(role: string | null | undefined): boolean {
	return canManagePayroll(role);
}
