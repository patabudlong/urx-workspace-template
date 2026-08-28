import type { PmProjectType } from '$lib/shared/project-management/project-types';

export const PM_ONBOARDING_DOMAIN_STATUSES = {
	HAVE_DOMAIN: 'have_domain',
	NEED_HELP: 'need_help',
	NOT_SURE: 'not_sure'
} as const;

export type PmOnboardingDomainStatus =
	(typeof PM_ONBOARDING_DOMAIN_STATUSES)[keyof typeof PM_ONBOARDING_DOMAIN_STATUSES];

export const PM_ONBOARDING_HOSTING_PREFERENCES = {
	WE_HOST: 'we_host',
	CLIENT_HOSTS: 'client_hosts',
	NOT_SURE: 'not_sure'
} as const;

export type PmOnboardingHostingPreference =
	(typeof PM_ONBOARDING_HOSTING_PREFERENCES)[keyof typeof PM_ONBOARDING_HOSTING_PREFERENCES];

export type PmProjectOnboarding = {
	contactName: string;
	contactEmail: string;
	businessName: string;
	projectGoals: string;
	pagesNeeded: string | null;
	brandNotes: string | null;
	domainStatus: PmOnboardingDomainStatus | null;
	hostingPreference: PmOnboardingHostingPreference | null;
	additionalNotes: string | null;
	submittedAt: string;
};

export type PmProjectOnboardingDocument = Omit<PmProjectOnboarding, 'submittedAt'> & {
	submittedAt: Date;
	/** @deprecated Use projectGoals — kept for legacy documents */
	websiteGoals?: string;
};

export type PmClientOnboardingPreview = {
	projectTitle: string;
	workspaceName: string;
	projectTypes: PmProjectType[];
	clientEmail: string;
	clientName: string | null;
	expiresAt: string;
	alreadySubmitted: boolean;
};
