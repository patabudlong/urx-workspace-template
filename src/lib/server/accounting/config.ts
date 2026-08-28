import { env } from '$env/dynamic/private';

export function getDefaultAccountingTimezone(): string {
	return env.ACCOUNTING_DEFAULT_TIMEZONE?.trim() || 'Asia/Manila';
}

export const DEFAULT_ACCOUNTING_CURRENCY = 'PHP' as const;
