export function formatFullName(firstName: string, lastName: string): string {
	return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
	const trimmed = fullName.trim();

	if (!trimmed) {
		return { firstName: '', lastName: '' };
	}

	const [firstName, ...rest] = trimmed.split(/\s+/);

	return {
		firstName,
		lastName: rest.join(' ')
	};
}
