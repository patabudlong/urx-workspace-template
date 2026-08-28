import { PM_PROJECT_STATUSES, type PmProjectStatus } from '$lib/shared/models/pm-project';
import { PM_PROJECT_TYPES, type PmProjectType } from '$lib/shared/project-management/project-types';

type SeedProjectTemplate = {
	title: string;
	status: PmProjectStatus;
	clientName: string;
	projectTypes: PmProjectType[];
	projectUrl: string | null;
	description: string;
	dueDateOffsetDays: number;
	notes: string;
};

export const PM_SEED_PROJECTS: SeedProjectTemplate[] = [
	{
		title: 'Bayan Tech corporate website',
		status: PM_PROJECT_STATUSES.ACTIVE,
		clientName: 'Bayan Tech Solutions',
		projectTypes: [PM_PROJECT_TYPES.WEBSITE, PM_PROJECT_TYPES.BRANDING],
		projectUrl: 'https://bayantech.ph',
		description: 'Marketing site refresh with case studies, pricing, and lead capture forms.',
		dueDateOffsetDays: 45,
		notes: 'Awaiting brand guidelines and homepage copy from client.'
	},
	{
		title: 'Luzon Retail e-commerce storefront',
		status: PM_PROJECT_STATUSES.PLANNING,
		clientName: 'Luzon Retail Group',
		projectTypes: [PM_PROJECT_TYPES.WEBSITE, PM_PROJECT_TYPES.SOFTWARE, PM_PROJECT_TYPES.DEVELOPMENT],
		projectUrl: 'https://shop.luzonretail.ph',
		description: 'Product catalog and checkout flow for three pilot store locations.',
		dueDateOffsetDays: 75,
		notes: 'Kickoff scheduled; product spreadsheet pending.'
	},
	{
		title: 'Harbor Cafe landing page',
		status: PM_PROJECT_STATUSES.ON_HOLD,
		clientName: 'Harbor Cafe Co.',
		projectTypes: [PM_PROJECT_TYPES.WEBSITE, PM_PROJECT_TYPES.MARKETING],
		projectUrl: 'https://harborcafe.ph',
		description: 'Single-page site for new branch opening with menu PDF and reservation CTA.',
		dueDateOffsetDays: 30,
		notes: 'Client paused until franchise approval is finalized.'
	},
	{
		title: 'NorthPeak Logistics portal',
		status: PM_PROJECT_STATUSES.COMPLETED,
		clientName: 'NorthPeak Logistics',
		projectTypes: [PM_PROJECT_TYPES.SOFTWARE, PM_PROJECT_TYPES.DEVELOPMENT, PM_PROJECT_TYPES.PROJECT],
		projectUrl: 'https://northpeaklogistics.com',
		description: 'Client portal for shipment tracking and document uploads.',
		dueDateOffsetDays: -14,
		notes: 'Launched on schedule; handoff documentation delivered.'
	}
];
