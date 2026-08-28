export const CRM_SEED_SUMMARY = {
	companyCount: 2,
	contactCount: 3,
	dealCount: 4
} as const;

export type CrmSeedStatus = {
	seeded: boolean;
	companyCount: number;
	contactCount: number;
	dealCount: number;
};
