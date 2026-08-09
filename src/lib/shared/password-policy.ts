export const PASSWORD_HISTORY_LIMIT = 5;

export const PASSWORD_RULES = [
	{
		id: 'length',
		label: 'At least 8 characters',
		test: (password: string) => password.length >= 8
	},
	{
		id: 'uppercase',
		label: 'One uppercase letter',
		test: (password: string) => /[A-Z]/.test(password)
	},
	{
		id: 'lowercase',
		label: 'One lowercase letter',
		test: (password: string) => /[a-z]/.test(password)
	},
	{
		id: 'number',
		label: 'One number',
		test: (password: string) => /\d/.test(password)
	},
	{
		id: 'special',
		label: 'One special character',
		test: (password: string) => /[^A-Za-z0-9]/.test(password)
	}
] as const;

export type PasswordRuleId = (typeof PASSWORD_RULES)[number]['id'];

export type PasswordCheck = {
	id: PasswordRuleId;
	label: string;
	passed: boolean;
};

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export type PasswordStrength = {
	score: number;
	level: PasswordStrengthLevel;
	label: string;
};

export function getPasswordChecks(password: string): PasswordCheck[] {
	return PASSWORD_RULES.map((rule) => ({
		id: rule.id,
		label: rule.label,
		passed: rule.test(password)
	}));
}

export function isPasswordStrong(password: string): boolean {
	return PASSWORD_RULES.every((rule) => rule.test(password));
}

export const PASSWORD_REQUIREMENTS_SUMMARY =
	'At least 8 characters with uppercase, lowercase, a number, and a special character.';

export function buildNextPasswordHistory(
	currentPasswordHash: string | undefined,
	existingHistory: string[] | undefined
): string[] {
	if (!currentPasswordHash) {
		return (existingHistory ?? []).slice(0, PASSWORD_HISTORY_LIMIT);
	}

	return [currentPasswordHash, ...(existingHistory ?? [])].slice(0, PASSWORD_HISTORY_LIMIT);
}

export function getPasswordStrength(password: string): PasswordStrength {
	if (!password) {
		return { score: 0, level: 'empty', label: '' };
	}

	const passedCount = getPasswordChecks(password).filter((check) => check.passed).length;

	if (passedCount <= 1) {
		return { score: 1, level: 'weak', label: 'Weak' };
	}

	if (passedCount <= 2) {
		return { score: 2, level: 'fair', label: 'Fair' };
	}

	if (passedCount <= 4) {
		return { score: 3, level: 'good', label: 'Good' };
	}

	return { score: 4, level: 'strong', label: 'Strong' };
}
