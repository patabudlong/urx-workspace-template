import type { Collection, Document } from 'mongodb';
import { getDb } from '$lib/server/db/client';

/** Register collection names here as the schema grows. */
export const CollectionNames = {
	users: 'users',
	consentEvents: 'consent_events',
	passwordResetTokens: 'password_reset_tokens',
	emailVerificationTokens: 'email_verification_tokens',
	phoneVerificationTokens: 'phone_verification_tokens',
	workspaces: 'workspaces',
	workspaceMembers: 'workspace_members',
	workspaceInvitations: 'workspace_invitations'
} as const;

type CollectionName = keyof typeof CollectionNames;

export async function getCollection<T extends Document = Document>(
	name: CollectionName
): Promise<Collection<T>> {
	const db = await getDb();
	return db.collection<T>(CollectionNames[name]);
}

export async function getUsersCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('users');
}

export async function getConsentEventsCollection<T extends Document = Document>(): Promise<
	Collection<T>
> {
	return getCollection<T>('consentEvents');
}

export async function getPasswordResetTokensCollection<T extends Document = Document>(): Promise<
	Collection<T>
> {
	return getCollection<T>('passwordResetTokens');
}

export async function getEmailVerificationTokensCollection<T extends Document = Document>(): Promise<
	Collection<T>
> {
	return getCollection<T>('emailVerificationTokens');
}

export async function getPhoneVerificationTokensCollection<T extends Document = Document>(): Promise<
	Collection<T>
> {
	return getCollection<T>('phoneVerificationTokens');
}

export async function getWorkspacesCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('workspaces');
}

export async function getWorkspaceMembersCollection<T extends Document = Document>(): Promise<
	Collection<T>
> {
	return getCollection<T>('workspaceMembers');
}

export async function getWorkspaceInvitationsCollection<T extends Document = Document>(): Promise<
	Collection<T>
> {
	return getCollection<T>('workspaceInvitations');
}
