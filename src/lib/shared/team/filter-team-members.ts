type SearchableTeamMember = {
	name: string;
	email: string;
	role: string;
	roleLabel: string;
};

export function filterTeamMembers<T extends SearchableTeamMember>(
	members: T[],
	query: string
): T[] {
	const normalizedQuery = query.trim().toLowerCase();

	if (!normalizedQuery) {
		return members;
	}

	return members.filter((member) => {
		const haystack = `${member.name} ${member.email} ${member.roleLabel} ${member.role}`.toLowerCase();

		return haystack.includes(normalizedQuery);
	});
}
