import type { ObjectId } from 'mongodb';

export type UserDocument = {
	_id: ObjectId;
	email: string;
	passwordHash: string;
	firstName: string;
	lastName: string;
	createdAt: Date;
	updatedAt: Date;
};
