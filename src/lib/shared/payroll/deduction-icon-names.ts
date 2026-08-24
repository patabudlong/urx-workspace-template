export const PH_DEDUCTION_ICON_PREFIX = 'payroll/deduction-icons/ph';

export const PH_DEDUCTION_ICON_KEYS = [
	'sss',
	'philhealth',
	'pagibig',
	'withholding-tax'
] as const;

export type PhDeductionIconKey = (typeof PH_DEDUCTION_ICON_KEYS)[number];

export const PH_DEDUCTION_ICON_FILES: Record<PhDeductionIconKey, string> = {
	sss: 'sss.png',
	philhealth: 'philhealth.png',
	pagibig: 'pagibig.png',
	'withholding-tax': 'withholding-tax.png'
};

/** Match workspace deduction type names to global PH icon keys. */
export function resolvePhDeductionIconKey(name: string): PhDeductionIconKey | null {
	const normalized = name.trim().toLowerCase();

	if (normalized === 'sss' || normalized.includes('social security')) {
		return 'sss';
	}

	if (normalized === 'philhealth' || normalized.includes('phil health')) {
		return 'philhealth';
	}

	if (normalized === 'pag-ibig' || normalized === 'pagibig' || normalized.includes('pag ibig')) {
		return 'pagibig';
	}

	if (
		normalized === 'withholding tax' ||
		normalized.includes('withholding') ||
		normalized === 'bir' ||
		normalized.includes('internal revenue')
	) {
		return 'withholding-tax';
	}

	return null;
}

export function resolvePhDeductionIconUrlFromMap(
	name: string,
	urlMap: Partial<Record<PhDeductionIconKey, string>>
): string | null {
	const key = resolvePhDeductionIconKey(name);

	if (!key) {
		return null;
	}

	return urlMap[key] ?? null;
}
