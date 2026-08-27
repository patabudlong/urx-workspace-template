import type { ObjectId } from 'mongodb';

export type CrmContactDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string | null;
	title: string | null;
	companyId: ObjectId | null;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type CrmContactDto = {
	id: string;
	workspaceId: string;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string | null;
	title: string | null;
	companyId: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
};
