export const PM_PROJECT_TYPES = {
	WEBSITE: 'website',
	PROJECT: 'project',
	SOFTWARE: 'software',
	DEVELOPMENT: 'development',
	BRANDING: 'branding',
	MARKETING: 'marketing',
	CONSULTING: 'consulting',
	OTHER: 'other'
} as const;

export type PmProjectType = (typeof PM_PROJECT_TYPES)[keyof typeof PM_PROJECT_TYPES];

export const PM_PROJECT_TYPE_OPTIONS: { value: PmProjectType; label: string }[] = [
	{ value: PM_PROJECT_TYPES.WEBSITE, label: 'Website' },
	{ value: PM_PROJECT_TYPES.PROJECT, label: 'Project' },
	{ value: PM_PROJECT_TYPES.SOFTWARE, label: 'Software' },
	{ value: PM_PROJECT_TYPES.DEVELOPMENT, label: 'Development' },
	{ value: PM_PROJECT_TYPES.BRANDING, label: 'Branding' },
	{ value: PM_PROJECT_TYPES.MARKETING, label: 'Marketing' },
	{ value: PM_PROJECT_TYPES.CONSULTING, label: 'Consulting' },
	{ value: PM_PROJECT_TYPES.OTHER, label: 'Other' }
];

const PM_PROJECT_TYPE_LABELS = Object.fromEntries(
	PM_PROJECT_TYPE_OPTIONS.map((option) => [option.value, option.label])
) as Record<PmProjectType, string>;

export function getPmProjectTypeLabel(type: PmProjectType): string {
	return PM_PROJECT_TYPE_LABELS[type];
}

export function formatPmProjectTypes(types: readonly PmProjectType[]): string {
	return types.map((type) => getPmProjectTypeLabel(type)).join(', ');
}

export function pmProjectIncludesWebsite(types: readonly PmProjectType[]): boolean {
	return types.includes(PM_PROJECT_TYPES.WEBSITE);
}

export function normalizePmProjectTypes(
	types: readonly string[] | undefined,
	legacyWebsiteUrl?: string | null
): PmProjectType[] {
	const allowed = new Set<string>(Object.values(PM_PROJECT_TYPES));
	const normalized = (types ?? []).filter((type): type is PmProjectType => allowed.has(type));

	if (normalized.length > 0) {
		return normalized;
	}

	return legacyWebsiteUrl ? [PM_PROJECT_TYPES.WEBSITE] : [PM_PROJECT_TYPES.PROJECT];
}
