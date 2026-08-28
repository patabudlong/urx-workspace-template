import { z } from 'zod';

export const WORKSPACE_PACKAGE_IDS = {
	MAILBOX: 'urixoft-workspace-mailbox',
	PAYROLL: 'urixoft-workspace-payroll',
	DTR: 'urixoft-workspace-dtr',
// urixoft-workspace-accounting:workspace-packages:start
	ACCOUNTING: 'urixoft-workspace-accounting',
// urixoft-workspace-accounting:workspace-packages:end
// urixoft-workspace-crm:workspace-packages:start
	CRM: 'urixoft-workspace-crm',
// urixoft-workspace-crm:workspace-packages:end
// urx-project_management-package:workspace-packages:start
	PROJECT_MANAGEMENT: 'urx-project_management-package'
// urx-project_management-package:workspace-packages:end
} as const;

export type WorkspacePackageId =
	(typeof WORKSPACE_PACKAGE_IDS)[keyof typeof WORKSPACE_PACKAGE_IDS];

export const workspacePackageIdSchema = z.enum([
	WORKSPACE_PACKAGE_IDS.MAILBOX,
	WORKSPACE_PACKAGE_IDS.PAYROLL,
	WORKSPACE_PACKAGE_IDS.DTR,
	WORKSPACE_PACKAGE_IDS.ACCOUNTING,
	WORKSPACE_PACKAGE_IDS.CRM,
	WORKSPACE_PACKAGE_IDS.PROJECT_MANAGEMENT
]);

export const workspacePackageIdsSchema = z.array(workspacePackageIdSchema);

export type WorkspacePackageMeta = {
	id: WorkspacePackageId;
	label: string;
	description: string;
};

export const WORKSPACE_PACKAGE_CATALOG: WorkspacePackageMeta[] = [
	{
		id: WORKSPACE_PACKAGE_IDS.MAILBOX,
		label: 'Mailbox',
		description:
			'Integrate Mailbox to send, receive, and manage emails directly from your workspace.'
	},
	{
		id: WORKSPACE_PACKAGE_IDS.PAYROLL,
		label: 'Payroll',
		description:
			'Connect Payroll to manage pay runs, employees, and compensation settings for your team.'
	},
	{
		id: WORKSPACE_PACKAGE_IDS.DTR,
		label: 'DTR',
		description:
			'Track daily time records, work schedules, and attendance linked to payroll employees.'
	},
	{
		id: WORKSPACE_PACKAGE_IDS.ACCOUNTING,
		label: 'Accounting',
		description:
			'Manage your chart of accounts, post manual journals, and run trial balances for PH compliance.'
	},
	{
		id: WORKSPACE_PACKAGE_IDS.CRM,
		label: 'CRM',
		description:
			'Track contacts, companies, and deals to manage customer relationships in your workspace.'
	},
	{
		id: WORKSPACE_PACKAGE_IDS.PROJECT_MANAGEMENT,
		label: 'Project Management',
		description:
			'Plan client projects, track delivery status, and manage onboarding follow-ups.'
	}
];

export function normalizeEnabledPackages(
	enabledPackages: readonly string[] | undefined
): WorkspacePackageId[] {
	if (!enabledPackages?.length) {
		return [];
	}

	const allowed = new Set<string>(Object.values(WORKSPACE_PACKAGE_IDS));

	return enabledPackages.filter((packageId): packageId is WorkspacePackageId =>
		allowed.has(packageId)
	);
}

export function isWorkspacePackageEnabled(
	enabledPackages: readonly string[] | undefined,
	packageId: WorkspacePackageId
): boolean {
	return normalizeEnabledPackages(enabledPackages).includes(packageId);
}

export function getWorkspacePackageMeta(
	packageId: WorkspacePackageId
): WorkspacePackageMeta | undefined {
	return WORKSPACE_PACKAGE_CATALOG.find((entry) => entry.id === packageId);
}
