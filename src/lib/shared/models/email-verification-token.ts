import type { ObjectId } from 'mongodb';

export type EmailVerificationTokenDocument = {
	_id: ObjectId;
	userId: ObjectId;
	tokenHash: string;
	expiresAt: Date;
	usedAt?: Date;
	createdAt: Date;
};
