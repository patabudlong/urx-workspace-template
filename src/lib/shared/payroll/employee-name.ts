export function formatPayrollEmployeeFullName(input: {
	firstName: string;
	initialName?: string | null;
	lastName: string;
}): string {
	return [input.firstName, input.initialName, input.lastName]
		.map((part) => part?.trim())
		.filter(Boolean)
		.join(' ');
}
