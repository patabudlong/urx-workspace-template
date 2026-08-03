export const TWO_FACTOR_METHODS = {
	TOTP: 'totp',
	SMS: 'sms',
	EMAIL: 'email',
	BACKUP: 'backup'
} as const;

export type TwoFactorMethod = (typeof TWO_FACTOR_METHODS)[keyof typeof TWO_FACTOR_METHODS];

export type TrustedDeviceDocument = {
	id: string;
	tokenHash: string;
	label?: string;
	createdAt: Date;
	expiresAt: Date;
};

export type UserTwoFactorDocument = {
	enabled: boolean;
	enabledAt?: Date;
	methods: {
		totp?: {
			secretEncrypted: string;
			enabledAt: Date;
		};
		sms?: {
			enabledAt: Date;
		};
		email?: {
			enabledAt: Date;
		};
	};
	pendingTotpSecretEncrypted?: string;
	backupCodeHashes: string[];
	trustedDevices: TrustedDeviceDocument[];
};

export const TRUSTED_DEVICE_TTL_DAYS = 30;
export const BACKUP_CODE_COUNT = 10;
