export type WorkspaceContext = {
	workspaceId: string;
	workspaceName: string;
	workspaceSlug: string;
	role: string;
	brandLogoUrl: string | null;
};

export function getWorkspaceInitials(workspaceName: string): string {
	const words = workspaceName.trim().split(/\s+/).filter(Boolean);

	if (words.length >= 2) {
		return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
	}

	const compact = workspaceName.trim();

	return compact.slice(0, 2).toUpperCase() || '?';
}
