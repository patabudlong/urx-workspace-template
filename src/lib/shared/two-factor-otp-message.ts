/** Shared copy and timing for 2FA OTP across SMS and email. */
export const TWO_FACTOR_OTP_EXPIRY_MINUTES = 15;

export function buildTwoFactorOtpSmsBody(code: string): string {
	return `Your Urixoft verification code is ${code}. It expires in ${TWO_FACTOR_OTP_EXPIRY_MINUTES} minutes.`;
}
