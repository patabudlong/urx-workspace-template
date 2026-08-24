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
	workspaceInvitations: 'workspace_invitations',
	twoFactorOtpTokens: 'two_factor_otp_tokens',
// urixoft-workspace-mailbox:collections:start
	userMailboxCredentials: 'user_mailbox_credentials',
// urixoft-workspace-mailbox:collections:end
// urixoft-workspace-payroll:collections:start
	payrollRuns: 'payroll_runs',
	payrollEmployees: 'payroll_employees',
	payrollSettings: 'payroll_settings',
// urixoft-workspace-payroll:collections:end
// urixoft-workspace-dtr:collections:start
	dtrSettings: 'dtr_settings',
	dtrDays: 'dtr_days',
	dtrWorkSchedules: 'dtr_work_schedules',
	dtrHolidayCalendars: 'dtr_holiday_calendars'
// urixoft-workspace-dtr:collections:end
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

export async function getTwoFactorOtpTokensCollection<T extends Document = Document>(): Promise<
	Collection<T>
> {
	return getCollection<T>('twoFactorOtpTokens');
}
// urixoft-workspace-mailbox:getter:start
export async function getUserMailboxCredentialsCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('userMailboxCredentials');
}
// urixoft-workspace-mailbox:getter:end
// urixoft-workspace-payroll:getter:start
export async function getPayrollRunsCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('payrollRuns');
}

export async function getPayrollEmployeesCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('payrollEmployees');
}

export async function getPayrollSettingsCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('payrollSettings');
}
// urixoft-workspace-payroll:getter:end
// urixoft-workspace-dtr:getter:start
export async function getDtrSettingsCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('dtrSettings');
}

export async function getDtrDaysCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('dtrDays');
}

export async function getDtrWorkSchedulesCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('dtrWorkSchedules');
}

export async function getDtrHolidayCalendarsCollection<T extends Document = Document>(): Promise<Collection<T>> {
	return getCollection<T>('dtrHolidayCalendars');
}
// urixoft-workspace-dtr:getter:end
