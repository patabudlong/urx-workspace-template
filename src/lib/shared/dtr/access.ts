import { canManagePayroll, canAccessPayrollWorkspace } from '$lib/shared/payroll/access';

/** DTR management uses the same workspace roles as payroll for v1. */
export function canManageDtr(role: string | null | undefined): boolean {
	return canManagePayroll(role);
}

/** Any workspace member with the DTR package can open employee self-service areas. */
export function canAccessDtrWorkspace(role: string | null | undefined): boolean {
	return canAccessPayrollWorkspace(role);
}

/** Employees linked to a payroll record can clock in/out and view their own time records. */
export function canViewOwnDtr(role: string | null | undefined): boolean {
	return canAccessDtrWorkspace(role);
}
