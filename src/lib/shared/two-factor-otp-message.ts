/** Shared copy and timing for OTP SMS across phone verification and 2FA. */
export const TWO_FACTOR_OTP_EXPIRY_MINUTES = 15;

export function buildTwoFactorOtpSmsBody(code: string): string {
	return `Your Urixoft Workspace verification code is ${code}. It expires in ${TWO_FACTOR_OTP_EXPIRY_MINUTES} minutes.`;
}
