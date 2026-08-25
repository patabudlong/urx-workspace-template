import type { PayrollEmployeeDto } from '$lib/shared/models/payroll-employee';

export function filterPayrollEmployees(
	employees: PayrollEmployeeDto[],
	query: string
): PayrollEmployeeDto[] {
	const normalizedQuery = query.trim().toLowerCase();

	if (!normalizedQuery) {
		return employees;
	}

	return employees.filter((employee) => {
		const haystack = [
			employee.fullName,
			employee.firstName,
			employee.initialName,
			employee.lastName,
			employee.email,
			employee.jobTitle,
			employee.employeeCode,
			employee.workScheduleName
		]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();

		return haystack.includes(normalizedQuery);
	});
}
