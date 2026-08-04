import { createHash, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { shouldUseSecureSessionCookie } from '$lib/server/auth/session';
import type { TrustedDeviceDocument } from '$lib/shared/models/two-factor';
import { TRUSTED_DEVICE_TTL_DAYS } from '$lib/shared/models/two-factor';

export const TRUSTED_DEVICE_COOKIE_NAME = 'urx_trusted_device';

const TRUSTED_DEVICE_TTL_SECONDS = TRUSTED_DEVICE_TTL_DAYS * 24 * 60 * 60;

type TrustedDeviceCookiePayload = {
	deviceId: string;
	token: string;
};

function hashTrustedDeviceToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function createTrustedDeviceRecord(input?: { label?: string }): {
	device: TrustedDeviceDocument;
	token: string;
} {
	const now = new Date();
	const token = randomBytes(32).toString('base64url');
	const deviceId = randomBytes(16).toString('hex');

	return {
		device: {
			id: deviceId,
			tokenHash: hashTrustedDeviceToken(token),
			label: input?.label,
			createdAt: now,
			expiresAt: new Date(now.getTime() + TRUSTED_DEVICE_TTL_SECONDS * 1000)
		},
		token
	};
}

export function parseTrustedDeviceCookie(value: string | undefined): TrustedDeviceCookiePayload | null {
	if (!value) {
		return null;
	}

	try {
		const parsed = JSON.parse(value) as TrustedDeviceCookiePayload;

		if (
			typeof parsed.deviceId === 'string' &&
			parsed.deviceId.length > 0 &&
			typeof parsed.token === 'string' &&
			parsed.token.length > 0
		) {
			return parsed;
		}
	} catch {
		return null;
	}

	return null;
}

export function isTrustedDeviceValid(
	devices: TrustedDeviceDocument[],
	cookiePayload: TrustedDeviceCookiePayload | null
): boolean {
	if (!cookiePayload) {
		return false;
	}

	const now = Date.now();
	const tokenHash = hashTrustedDeviceToken(cookiePayload.token);

	return devices.some(
		(device) =>
			device.id === cookiePayload.deviceId &&
			device.tokenHash === tokenHash &&
			device.expiresAt.getTime() > now
	);
}

export function getTrustedDeviceCookieOptions(): {
	path: string;
	httpOnly: boolean;
	sameSite: 'lax';
	secure: boolean;
	maxAge: number;
} {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: shouldUseSecureSessionCookie(),
		maxAge: TRUSTED_DEVICE_TTL_SECONDS
	};
}

export function setTrustedDeviceCookie(
	cookies: Cookies,
	input: { deviceId: string; token: string }
): void {
	cookies.set(
		TRUSTED_DEVICE_COOKIE_NAME,
		JSON.stringify({ deviceId: input.deviceId, token: input.token }),
		getTrustedDeviceCookieOptions()
	);
}

export function clearTrustedDeviceCookie(cookies: Cookies): void {
	const options = getTrustedDeviceCookieOptions();

	cookies.delete(TRUSTED_DEVICE_COOKIE_NAME, {
		path: options.path,
		httpOnly: options.httpOnly,
		sameSite: options.sameSite,
		secure: options.secure
	});
}

export function pruneExpiredTrustedDevices(devices: TrustedDeviceDocument[]): TrustedDeviceDocument[] {
	const now = Date.now();

	return devices.filter((device) => device.expiresAt.getTime() > now);
}
