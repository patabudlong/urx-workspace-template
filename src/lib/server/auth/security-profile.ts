import type { UserDocument } from '$lib/shared/models/user';
import type { SecurityProfile, TrustedDeviceSummary } from '$lib/shared/schemas/security';
import { getUserTwoFactor } from '$lib/server/repositories/user-two-factor';
import { isUserEmailVerified, isUserPhoneVerified } from '$lib/server/repositories/users';

function toIsoDateString(value: Date | undefined): string | null {
	if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
		return null;
	}

	return value.toISOString();
}

function toTrustedDeviceSummary(device: {
	id: string;
	label?: string;
	createdAt: Date;
	expiresAt: Date;
}): TrustedDeviceSummary {
	return {
		id: device.id,
		label: device.label ?? null,
		createdAt: device.createdAt.toISOString(),
		expiresAt: device.expiresAt.toISOString()
	};
}

export function toSecurityProfile(user: UserDocument): SecurityProfile {
	const hasAppPassword = Boolean(user.passwordHash);
	const twoFactor = getUserTwoFactor(user);

	return {
		hasAppPassword,
		hasGoogleAccount: Boolean(user.googleId),
		passwordChangedAt: hasAppPassword
			? toIsoDateString(user.passwordChangedAt) ?? toIsoDateString(user.createdAt)
			: null,
		twoFactor: {
			enabled: twoFactor.enabled,
			methods: [
				...(twoFactor.methods.totp ? ['totp' as const] : []),
				...(twoFactor.methods.sms ? ['sms' as const] : []),
				...(twoFactor.methods.email ? ['email' as const] : [])
			],
			hasBackupCodes: twoFactor.backupCodeHashes.length > 0,
			backupCodesRemaining: twoFactor.backupCodeHashes.length,
			trustedDevices: twoFactor.trustedDevices.map(toTrustedDeviceSummary),
			smsAvailable: Boolean(user.phoneNumber) && isUserPhoneVerified(user),
			emailAvailable: isUserEmailVerified(user),
			totpEnabled: Boolean(twoFactor.methods.totp),
			smsEnabled: Boolean(twoFactor.methods.sms),
			emailEnabled: Boolean(twoFactor.methods.email)
		}
	};
}
