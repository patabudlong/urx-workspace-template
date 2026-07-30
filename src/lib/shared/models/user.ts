import type { ObjectId } from 'mongodb';

export type UserDocument = {
	_id: ObjectId;
	email: string;
	passwordHash: string;
	name?: string;
	createdAt: Date;
	updatedAt: Date;
};
