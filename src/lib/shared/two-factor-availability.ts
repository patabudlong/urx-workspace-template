/** Temporary — set true when SMS 2FA setup is ready for production. */
export const TWO_FACTOR_SMS_SETUP_AVAILABLE = false;

export function isTwoFactorSmsSetupAvailable(): boolean {
	return TWO_FACTOR_SMS_SETUP_AVAILABLE;
}
