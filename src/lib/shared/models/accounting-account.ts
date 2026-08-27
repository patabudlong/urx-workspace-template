import type { ObjectId } from 'mongodb';
import type { AccountType } from '$lib/shared/accounting/core/account-types';

export type AccountingAccountDocument = {
	_id: ObjectId;
	workspaceId: ObjectId;
	code: string;
	name: string;
	type: AccountType;
	description?: string | null;
	isActive: boolean;
	isSystem: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type AccountingAccountDto = {
	id: string;
	workspaceId: string;
	code: string;
	name: string;
	type: AccountType;
	description: string | null;
	isActive: boolean;
	isSystem: boolean;
};
