import { CRM_DEAL_STAGES, type CrmDealStage } from '$lib/shared/models/crm-deal';

type SeedCompanyTemplate = {
	key: string;
	name: string;
	domain: string;
	industry: string;
	phone: string;
	notes: string;
};

type SeedContactTemplate = {
	key: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	title: string;
	companyKey: string;
	notes: string;
};

type SeedDealTemplate = {
	title: string;
	stage: CrmDealStage;
	value: number;
	companyKey: string;
	contactKey: string;
	expectedCloseDateOffsetDays: number;
	notes: string;
};

export const CRM_SEED_COMPANIES: SeedCompanyTemplate[] = [
	{
		key: 'bayan-tech',
		name: 'Bayan Tech Solutions',
		domain: 'bayantech.ph',
		industry: 'Technology',
		phone: '+63 2 8123 4567',
		notes: 'Mid-market SaaS buyer evaluating annual contracts.'
	},
	{
		key: 'luzon-retail',
		name: 'Luzon Retail Group',
		domain: 'luzonretail.ph',
		industry: 'Retail',
		phone: '+63 2 8987 6543',
		notes: 'Regional retail chain with multiple store locations.'
	}
];

export const CRM_SEED_CONTACTS: SeedContactTemplate[] = [
	{
		key: 'maria-santos',
		firstName: 'Maria',
		lastName: 'Santos',
		email: 'maria.santos@bayantech.ph',
		phone: '+63 917 123 4567',
		title: 'VP Sales',
		companyKey: 'bayan-tech',
		notes: 'Primary decision maker for software procurement.'
	},
	{
		key: 'juan-reyes',
		firstName: 'Juan',
		lastName: 'Reyes',
		email: 'juan.reyes@luzonretail.ph',
		phone: '+63 918 234 5678',
		title: 'Operations Director',
		companyKey: 'luzon-retail',
		notes: 'Interested in workflow automation across stores.'
	},
	{
		key: 'ana-cruz',
		firstName: 'Ana',
		lastName: 'Cruz',
		email: 'ana.cruz@bayantech.ph',
		phone: '+63 919 345 6789',
		title: 'Finance Manager',
		companyKey: 'bayan-tech',
		notes: 'Handles budget approvals and contract review.'
	}
];

export const CRM_SEED_DEALS: SeedDealTemplate[] = [
	{
		title: 'Annual SaaS subscription',
		stage: CRM_DEAL_STAGES.PROPOSAL,
		value: 250_000,
		companyKey: 'bayan-tech',
		contactKey: 'maria-santos',
		expectedCloseDateOffsetDays: 30,
		notes: 'Proposal sent for 50-seat annual plan.'
	},
	{
		title: 'Store operations rollout',
		stage: CRM_DEAL_STAGES.QUALIFIED,
		value: 480_000,
		companyKey: 'luzon-retail',
		contactKey: 'juan-reyes',
		expectedCloseDateOffsetDays: 45,
		notes: 'Qualified after discovery call with operations team.'
	},
	{
		title: 'Finance module add-on',
		stage: CRM_DEAL_STAGES.NEGOTIATION,
		value: 120_000,
		companyKey: 'bayan-tech',
		contactKey: 'ana-cruz',
		expectedCloseDateOffsetDays: 14,
		notes: 'Negotiating payment terms and onboarding timeline.'
	},
	{
		title: 'Pilot for 3 branches',
		stage: CRM_DEAL_STAGES.LEAD,
		value: 75_000,
		companyKey: 'luzon-retail',
		contactKey: 'juan-reyes',
		expectedCloseDateOffsetDays: 60,
		notes: 'Initial lead from trade show follow-up.'
	}
];
