export const WORKSPACE_TEAM_SIZE_OPTIONS = [
	{ value: '1-5', label: '1–5 people' },
	{ value: '6-10', label: '6–10 people' },
	{ value: '11-25', label: '11–25 people' },
	{ value: '26-50', label: '26–50 people' },
	{ value: '51-100', label: '51–100 people' },
	{ value: '100+', label: '100+ people' }
] as const;

export type WorkspaceTeamSize = (typeof WORKSPACE_TEAM_SIZE_OPTIONS)[number]['value'];

export const WORKSPACE_TEAM_SIZE_VALUES = WORKSPACE_TEAM_SIZE_OPTIONS.map((option) => option.value);

export const WORKSPACE_COUNTRIES = [
	'Australia',
	'Canada',
	'Germany',
	'India',
	'Ireland',
	'Japan',
	'New Zealand',
	'Philippines',
	'Singapore',
	'United Arab Emirates',
	'United Kingdom',
	'United States',
	'Other'
] as const;

export type WorkspaceCountry = (typeof WORKSPACE_COUNTRIES)[number];

export type OnboardingFeatureTourIcon = 'briefcase' | 'users' | 'clipboard-list' | 'trending-up';

export type OnboardingFeatureTourItem = {
	title: string;
	description: string;
	icon: OnboardingFeatureTourIcon;
	imageSrc?: string;
	imageAlt?: string;
};

export const ONBOARDING_FEATURE_TOUR: OnboardingFeatureTourItem[] = [
	{
		title: 'Run your business in one place',
		description:
			'Organize clients, jobs, and daily operations from a single workspace built for service teams.',
		icon: 'briefcase',
		imageSrc: '/onboarding/run-your-business.png?v=7',
		imageAlt:
			'Illustration of a professional managing a business dashboard with charts, reports, and data tools.'
	},
	{
		title: 'Stay connected with your team',
		description: 'Email, SMS, and scheduling tools keep everyone aligned without switching apps.',
		icon: 'users',
		imageSrc: '/onboarding/stay-connected.png?v=7',
		imageAlt:
			'Illustration of diverse team members connected around a globe with location pins and office buildings.'
	},
	{
		title: 'Track work from start to finish',
		description: 'Plan visits, manage tasks, and store files where your whole team can find them.',
		icon: 'clipboard-list',
		imageSrc: '/onboarding/track-work.png?v=7',
		imageAlt:
			'Illustration of team members organizing tasks on a Kanban project board.'
	},
	{
		title: 'Grow with confidence',
		description: 'Invite teammates, manage access, and scale as your company expands.',
		icon: 'trending-up',
		imageSrc: '/onboarding/grow-with-confidence.png?v=8',
		imageAlt:
			'Illustration of a professional presenting growth charts and analytics on a display board.'
	}
];
