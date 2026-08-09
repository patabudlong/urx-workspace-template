import type { UserDocument } from '$lib/shared/models/user';
import type { TrustedDeviceDocument, TwoFactorMethod, UserTwoFactorDocument } from '$lib/shared/models/two-factor';
import { TWO_FACTOR_METHODS } from '$lib/shared/models/two-factor';
import { getUsersCollection } from '$lib/server/db/collections';
import { pruneExpiredTrustedDevices } from '$lib/server/auth/two-factor/trusted-devices';
import { ObjectId } from 'mongodb';

function emptyTwoFactor(): UserTwoFactorDocument {
	return {
		enabled: false,
		methods: {},
		backupCodeHashes: [],
		trustedDevices: []
	};
}

export function getUserTwoFactor(user: UserDocument): UserTwoFactorDocument {
	const twoFactor = user.twoFactor;

	if (!twoFactor) {
		return emptyTwoFactor();
	}

	return {
		enabled: twoFactor.enabled ?? false,
		enabledAt: twoFactor.enabledAt,
		methods: twoFactor.methods ?? {},
		pendingTotpSecretEncrypted: twoFactor.pendingTotpSecretEncrypted,
		backupCodeHashes: twoFactor.backupCodeHashes ?? [],
		trustedDevices: pruneExpiredTrustedDevices(twoFactor.trustedDevices ?? [])
	};
}

export function isTwoFactorEnabled(user: UserDocument): boolean {
	return Boolean(user.twoFactor?.enabled);
}

export function getEnabledTwoFactorMethods(user: UserDocument): TwoFactorMethod[] {
	const twoFactor = getUserTwoFactor(user);
	const methods: TwoFactorMethod[] = [];

	if (twoFactor.methods.totp) {
		methods.push(TWO_FACTOR_METHODS.TOTP);
	}

	if (twoFactor.methods.sms) {
		methods.push(TWO_FACTOR_METHODS.SMS);
	}

	if (twoFactor.methods.email) {
		methods.push(TWO_FACTOR_METHODS.EMAIL);
	}

	return methods;
}

export async function setPendingTotpSecret(
	userId: string,
	secretEncrypted: string
): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				'twoFactor.pendingTotpSecretEncrypted': secretEncrypted,
				updatedAt: now
			}
		}
	);

	return result.matchedCount === 1;
}

export async function clearPendingTotpSecret(userId: string): Promise<void> {
	const users = await getUsersCollection<UserDocument>();

	await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$unset: { 'twoFactor.pendingTotpSecretEncrypted': '' },
			$set: { updatedAt: new Date() }
		}
	);
}

export async function enableTotpMethod(
	userId: string,
	input: { secretEncrypted: string; backupCodeHashes?: string[] }
): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const update: Record<string, unknown> = {
		'twoFactor.enabled': true,
		'twoFactor.enabledAt': now,
		'twoFactor.methods.totp': {
			secretEncrypted: input.secretEncrypted,
			enabledAt: now
		},
		updatedAt: now
	};

	const unset = {
		'twoFactor.pendingTotpSecretEncrypted': '' as const
	};

	if (input.backupCodeHashes) {
		update['twoFactor.backupCodeHashes'] = input.backupCodeHashes;
	}

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{ $set: update, $unset: unset }
	);

	return result.matchedCount === 1;
}

export async function enableSmsTwoFactorMethod(userId: string): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				'twoFactor.enabled': true,
				'twoFactor.enabledAt': now,
				'twoFactor.methods.sms': { enabledAt: now },
				updatedAt: now
			}
		}
	);

	return result.matchedCount === 1;
}

export async function enableEmailTwoFactorMethod(userId: string): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				'twoFactor.enabled': true,
				'twoFactor.enabledAt': now,
				'twoFactor.methods.email': { enabledAt: now },
				updatedAt: now
			}
		}
	);

	return result.matchedCount === 1;
}

export async function disableTwoFactorForUser(userId: string): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				twoFactor: {
					enabled: false,
					methods: {},
					backupCodeHashes: [],
					trustedDevices: []
				},
				updatedAt: now
			}
		}
	);

	return result.matchedCount === 1;
}

export async function regenerateBackupCodes(
	userId: string,
	backupCodeHashes: string[]
): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				'twoFactor.backupCodeHashes': backupCodeHashes,
				updatedAt: now
			}
		}
	);

	return result.matchedCount === 1;
}

export async function consumeBackupCode(userId: string, code: string, remainingHashes: string[]): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				'twoFactor.backupCodeHashes': remainingHashes,
				updatedAt: now
			}
		}
	);

	return result.matchedCount === 1;
}

export async function addTrustedDevice(
	userId: string,
	device: TrustedDeviceDocument
): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$push: { 'twoFactor.trustedDevices': device },
			$set: { updatedAt: now }
		}
	);

	return result.matchedCount === 1;
}

export async function removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$pull: { 'twoFactor.trustedDevices': { id: deviceId } },
			$set: { updatedAt: now }
		}
	);

	return result.matchedCount === 1;
}

export async function removeAllTrustedDevices(userId: string): Promise<boolean> {
	const users = await getUsersCollection<UserDocument>();
	const now = new Date();

	const result = await users.updateOne(
		{ _id: new ObjectId(userId) },
		{
			$set: {
				'twoFactor.trustedDevices': [],
				updatedAt: now
			}
		}
	);

	return result.matchedCount === 1;
}
