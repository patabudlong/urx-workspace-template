import type { ObjectId } from 'mongodb';

export type TermsConsent = {
	acceptedAt: Date;
	ipAddress: string;
	policyVersion: string;
};

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
	createdAt: Date;
	updatedAt: Date;
};
