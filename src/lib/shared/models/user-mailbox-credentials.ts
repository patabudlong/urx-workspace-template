import type { ObjectId } from 'mongodb';

export type MailboxServerSettings = {
	host: string;
	port: number;
	secure: boolean;
};

export type UserMailboxCredentialsDocument = {
	_id: ObjectId;
	userId: ObjectId;
	email: string;
	passwordEncrypted: string;
	displayName: string;
	imap: MailboxServerSettings;
	smtp: MailboxServerSettings;
	connectedAt: Date;
	lastVerifiedAt?: Date;
	updatedAt: Date;
};

export type UserMailboxCredentialsStatus = {
	connected: boolean;
	email?: string;
	displayName?: string;
	connectedAt?: string;
	lastVerifiedAt?: string;
};
