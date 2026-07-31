import type { ObjectId } from 'mongodb';

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
	googleId?: string;
	firstName: string;
	lastName: string;
	emailVerifiedAt?: Date;
	termsConsent?: TermsConsent;
	platformRole?: PlatformRole;
	createdAt: Date;
	updatedAt: Date;
};
