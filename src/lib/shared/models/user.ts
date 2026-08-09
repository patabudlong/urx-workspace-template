import type { ObjectId } from 'mongodb';
import type { PresenceStatus } from '$lib/shared/presence';
import type { UserTwoFactorDocument } from '$lib/shared/models/two-factor';

export type TermsConsent = {
	acceptedAt: Date;
	ipAddress: string;
	policyVersion: string;
};

export const PLATFORM_ROLES = {
	SUPERADMIN: 'superadmin'
} as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[keyof typeof PLATFORM_ROLES];

export type UserDocument = {
	_id: ObjectId;
	email: string;
	passwordHash?: string;
	passwordHistory?: string[];
	passwordChangedAt?: Date;
	googleId?: string;
	firstName: string;
	lastName: string;
	avatarUrl?: string;
	phoneNumber?: string;
	phoneVerifiedAt?: Date;
	emailVerifiedAt?: Date;
	termsConsent?: TermsConsent;
	platformRole?: PlatformRole;
	presenceStatus?: PresenceStatus;
	lastSeenAt?: Date;
	twoFactor?: UserTwoFactorDocument;
	createdAt: Date;
	updatedAt: Date;
};
