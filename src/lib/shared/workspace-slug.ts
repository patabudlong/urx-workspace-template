const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyWorkspaceName(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-')
		.slice(0, 48);
}

export function isValidWorkspaceSlug(slug: string): boolean {
	return slug.length >= 2 && slug.length <= 48 && SLUG_PATTERN.test(slug);
}
