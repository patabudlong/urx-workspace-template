export type PmDocumentChecklistTemplate = {
	title: string;
	description: string;
	required: boolean;
};

export const PM_DEFAULT_DOCUMENT_CHECKLIST: PmDocumentChecklistTemplate[] = [
	{
		title: 'Company logo',
		description: 'High-resolution logo files (PNG, SVG, or AI).',
		required: true
	},
	{
		title: 'Brand guidelines',
		description: 'Colors, fonts, and brand assets if available.',
		required: false
	},
	{
		title: 'Website copy',
		description: 'Text content for key pages or sections.',
		required: true
	},
	{
		title: 'Domain access',
		description: 'DNS records or registrar login details if you manage the domain.',
		required: false
	}
];
