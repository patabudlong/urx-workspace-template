export const PM_SEED_SUMMARY = {
	projectCount: 4
} as const;

export type PmSeedStatus = {
	seeded: boolean;
	projectCount: number;
};
