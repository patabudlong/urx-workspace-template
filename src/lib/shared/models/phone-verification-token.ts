import type { ObjectId } from 'mongodb';

export type PhoneVerificationTokenDocument = {
	_id: ObjectId;
	userId: ObjectId;
	phoneNumber: string;
	tokenHash: string;
	expiresAt: Date;
	usedAt?: Date;
	createdAt: Date;
};
