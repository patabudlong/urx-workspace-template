import type { ObjectId } from 'mongodb';

export type CrmCompanyDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	name: string;
	domain: string | null;
	industry: string | null;
	phone: string | null;
	notes: string | null;
	isSeed?: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type CrmCompanyDto = {
	id: string;
	workspaceId: string;
	name: string;
	domain: string | null;
	industry: string | null;
	phone: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
};
