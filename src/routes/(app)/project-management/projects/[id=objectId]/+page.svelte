<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import PmDocumentChecklistCard from '$lib/components/project-management/pm-document-checklist-card.svelte';
	import PmDeliveryActivityCard from '$lib/components/project-management/pm-delivery-activity-card.svelte';
	import PmDeliveryMilestonesCard from '$lib/components/project-management/pm-delivery-milestones-card.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		PM_CLIENT_INVITE_FAILED_MESSAGE,
		PM_CLIENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE,
		PM_CLIENT_INVITE_SENT_MESSAGE,
		PM_DOCUMENT_INVITE_FAILED_MESSAGE,
		PM_DOCUMENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE,
		PM_DOCUMENT_INVITE_SENT_MESSAGE,
		PM_DOCUMENT_REMINDER_FAILED_MESSAGE,
		PM_DOCUMENT_REMINDER_SENT_MESSAGE,
		PM_PROJECT_UPDATE_FAILED_MESSAGE,
		PM_PROJECT_UPDATED_MESSAGE
	} from '$lib/shared/project-management/messages';
	import {
		PM_ONBOARDING_DOMAIN_STATUSES,
		PM_ONBOARDING_HOSTING_PREFERENCES
	} from '$lib/shared/models/pm-project-onboarding';
	import { PM_PROJECT_STATUSES } from '$lib/shared/models/pm-project';
	import { PM_CLIENT_INVITATION_STATUSES } from '$lib/shared/models/pm-client-invitation';
	import { getPmProjectTypeLabel } from '$lib/shared/project-management/project-types';
	import {
		pmClientInviteFormSchema,
		pmProjectStatusFormSchema
	} from '$lib/shared/project-management/schemas';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let statusSubmitting = $state(false);
	let inviteSubmitting = $state(false);
	let documentInviteSubmitting = $state(false);
	let documentReminderSubmitting = $state(false);

	const statusLabels: Record<string, string> = {
		[PM_PROJECT_STATUSES.PLANNING]: 'Planning',
		[PM_PROJECT_STATUSES.ACTIVE]: 'Active',
		[PM_PROJECT_STATUSES.ON_HOLD]: 'On hold',
		[PM_PROJECT_STATUSES.COMPLETED]: 'Completed',
		[PM_PROJECT_STATUSES.CANCELLED]: 'Cancelled'
	};

	const invitationStatusLabels: Record<string, string> = {
		[PM_CLIENT_INVITATION_STATUSES.PENDING]: 'Pending',
		[PM_CLIENT_INVITATION_STATUSES.COMPLETED]: 'Completed',
		[PM_CLIENT_INVITATION_STATUSES.REVOKED]: 'Revoked',
		[PM_CLIENT_INVITATION_STATUSES.EXPIRED]: 'Expired'
	};

	const domainStatusLabels: Record<string, string> = {
		[PM_ONBOARDING_DOMAIN_STATUSES.HAVE_DOMAIN]: 'Have a domain',
		[PM_ONBOARDING_DOMAIN_STATUSES.NEED_HELP]: 'Need domain help',
		[PM_ONBOARDING_DOMAIN_STATUSES.NOT_SURE]: 'Not sure'
	};

	const hostingLabels: Record<string, string> = {
		[PM_ONBOARDING_HOSTING_PREFERENCES.WE_HOST]: 'We host',
		[PM_ONBOARDING_HOSTING_PREFERENCES.CLIENT_HOSTS]: 'Client hosts',
		[PM_ONBOARDING_HOSTING_PREFERENCES.NOT_SURE]: 'Not sure'
	};

	const statusSuperform = superForm(untrack(() => data.statusForm), {
		validators: zod4Client(pmProjectStatusFormSchema),
		resetForm: false,
		onSubmit: () => {
			statusSubmitting = true;
		},
		onUpdated: async ({ form }) => {
			statusSubmitting = false;
			if (form.message === PM_PROJECT_UPDATED_MESSAGE) {
				toast.success('Project updated', { description: PM_PROJECT_UPDATED_MESSAGE });
				await invalidateAll();
				return;
			}

			if (typeof form.message === 'string' && form.message.length > 0) {
				toast.error('Could not update project', {
					description:
						form.message === PM_PROJECT_UPDATE_FAILED_MESSAGE
							? PM_PROJECT_UPDATE_FAILED_MESSAGE
							: form.message
				});
			}
		},
		onError: () => {
			statusSubmitting = false;
		}
	});

	const inviteSuperform = superForm(untrack(() => data.inviteForm), {
		validators: zod4Client(pmClientInviteFormSchema),
		resetForm: false,
		onSubmit: () => {
			inviteSubmitting = true;
		},
		onUpdated: async ({ form }) => {
			inviteSubmitting = false;
			if (form.message === PM_CLIENT_INVITE_SENT_MESSAGE) {
				toast.success('Invitation sent', { description: PM_CLIENT_INVITE_SENT_MESSAGE });
				await invalidateAll();
				return;
			}

			if (typeof form.message === 'string' && form.message.length > 0) {
				toast.error('Could not send invitation', {
					description:
						form.message === PM_CLIENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE
							? PM_CLIENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE
							: form.message === PM_CLIENT_INVITE_FAILED_MESSAGE
								? PM_CLIENT_INVITE_FAILED_MESSAGE
								: form.message
				});
			}
		},
		onError: () => {
			inviteSubmitting = false;
		}
	});

	const { enhance: enhanceStatus, form: statusForm, message: statusMessage } = statusSuperform;
	const { enhance: enhanceInvite, form: inviteForm, message: inviteMessage } = inviteSuperform;

	const documentInviteSuperform = superForm(untrack(() => data.documentInviteForm), {
		validators: zod4Client(pmClientInviteFormSchema),
		resetForm: false,
		onSubmit: () => {
			documentInviteSubmitting = true;
		},
		onUpdated: async ({ form }) => {
			documentInviteSubmitting = false;
			if (form.message === PM_DOCUMENT_INVITE_SENT_MESSAGE) {
				toast.success('Document invitation sent', {
					description: PM_DOCUMENT_INVITE_SENT_MESSAGE
				});
				await invalidateAll();
				return;
			}

			if (typeof form.message === 'string' && form.message.length > 0) {
				toast.error('Could not send document invitation', {
					description:
						form.message === PM_DOCUMENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE
							? PM_DOCUMENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE
							: form.message === PM_DOCUMENT_INVITE_FAILED_MESSAGE
								? PM_DOCUMENT_INVITE_FAILED_MESSAGE
								: form.message
				});
			}
		},
		onError: () => {
			documentInviteSubmitting = false;
		}
	});

	const {
		enhance: enhanceDocumentInvite,
		form: documentInviteForm,
		message: documentInviteMessage
	} = documentInviteSuperform;

	function formatDate(value: string | null): string {
		if (!value) {
			return '—';
		}

		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
	}

	function formatDateTime(value: string | null): string {
		if (!value) {
			return '—';
		}

		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	function statusVariant(status: string): 'secondary' | 'default' | 'destructive' {
		if (status === PM_PROJECT_STATUSES.COMPLETED) {
			return 'default';
		}

		if (status === PM_PROJECT_STATUSES.CANCELLED) {
			return 'destructive';
		}

		return 'secondary';
	}

	$effect(() => {
		if (page.url.searchParams.get('updated') === '1') {
			toast.success('Project updated', { description: PM_PROJECT_UPDATED_MESSAGE });
		}

		if (page.url.searchParams.get('fromCrmDeal') === '1') {
			toast.success('Project created', {
				description: 'This project was created from a won CRM deal.'
			});
		}
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Project Management"
		title={data.project.title}
		description="Project details, client onboarding, and delivery status."
	>
		{#snippet actions()}
			<Button href="/project-management/projects" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to projects
			</Button>
		{/snippet}
	</PageHeader>

	{#if page.url.searchParams.get('updated') === '1'}
		<StatusAlert variant="success" title="Project updated" description={PM_PROJECT_UPDATED_MESSAGE} />
	{/if}

	{#if typeof $statusMessage === 'string' && $statusMessage.length > 0}
		{#if $statusMessage === PM_PROJECT_UPDATED_MESSAGE}
			<StatusAlert variant="success" title="Project updated" description={PM_PROJECT_UPDATED_MESSAGE} />
		{:else}
			<StatusAlert
				variant="danger"
				title="Could not update project"
				description={$statusMessage === PM_PROJECT_UPDATE_FAILED_MESSAGE
					? PM_PROJECT_UPDATE_FAILED_MESSAGE
					: $statusMessage}
			/>
		{/if}
	{:else if typeof $inviteMessage === 'string' && $inviteMessage.length > 0}
		{#if $inviteMessage === PM_CLIENT_INVITE_SENT_MESSAGE}
			<StatusAlert variant="success" title="Invitation sent" description={PM_CLIENT_INVITE_SENT_MESSAGE} />
		{:else}
			<StatusAlert
				variant="danger"
				title="Could not send invitation"
				description={$inviteMessage === PM_CLIENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE
					? PM_CLIENT_INVITE_MAIL_NOT_CONFIGURED_MESSAGE
					: $inviteMessage === PM_CLIENT_INVITE_FAILED_MESSAGE
						? PM_CLIENT_INVITE_FAILED_MESSAGE
						: $inviteMessage}
			/>
		{/if}
	{/if}

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
		<div class="flex flex-col gap-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>Overview</Card.Title>
					<Card.Description>Client and delivery details for this project.</Card.Description>
					<Card.Action>
						<Button href="/project-management/projects/{data.project.id}/edit" class="h-10">
							<PencilIcon class="size-4" aria-hidden="true" />
							Edit project
						</Button>
					</Card.Action>
				</Card.Header>
				<Card.Content class="space-y-4 text-sm">
					<div class="flex items-center justify-between gap-4">
						<span class="text-muted-foreground">Status</span>
						<Badge variant={statusVariant(data.project.status)}>
							{statusLabels[data.project.status]}
						</Badge>
					</div>
					<div class="flex items-center justify-between gap-4">
						<span class="text-muted-foreground">Client</span>
						<span>{data.project.clientName ?? '—'}</span>
					</div>
					<div class="flex items-center justify-between gap-4">
						<span class="text-muted-foreground">Assignee</span>
						<span>{data.assignee?.name ?? 'Unassigned'}</span>
					</div>
					{#if data.crmActive && data.project.crmDealId}
						<div class="flex items-center justify-between gap-4">
							<span class="text-muted-foreground">CRM deal</span>
							<a
								class="text-primary hover:underline"
								href="/crm/deals/{data.project.crmDealId}"
							>
								View deal
							</a>
						</div>
					{/if}
					<div class="space-y-2">
						<p class="text-muted-foreground">Project types</p>
						<div class="flex flex-wrap gap-2">
							{#each data.project.projectTypes as projectType (projectType)}
								<Badge variant="secondary">{getPmProjectTypeLabel(projectType)}</Badge>
							{/each}
						</div>
					</div>
					<div class="flex items-center justify-between gap-4">
						<span class="text-muted-foreground">Project URL</span>
						<span class="truncate">{data.project.projectUrl ?? '—'}</span>
					</div>
					<div class="flex items-center justify-between gap-4">
						<span class="text-muted-foreground">Target completion</span>
						<span>{formatDate(data.project.dueDate)}</span>
					</div>
					{#if data.project.description}
						<div class="space-y-1">
							<p class="text-muted-foreground">Description</p>
							<p class="leading-relaxed">{data.project.description}</p>
						</div>
					{/if}
					{#if data.project.notes}
						<div class="space-y-1">
							<p class="text-muted-foreground">Internal notes</p>
							<p class="leading-relaxed">{data.project.notes}</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			{#if data.project.onboarding}
				<Card.Root>
					<Card.Header>
						<Card.Title>Client onboarding responses</Card.Title>
						<Card.Description>
							Submitted {formatDateTime(data.project.onboarding.submittedAt)}.
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4 text-sm">
						<div class="flex items-center justify-between gap-4">
							<span class="text-muted-foreground">Contact</span>
							<span>{data.project.onboarding.contactName}</span>
						</div>
						<div class="flex items-center justify-between gap-4">
							<span class="text-muted-foreground">Email</span>
							<span>{data.project.onboarding.contactEmail}</span>
						</div>
						<div class="flex items-center justify-between gap-4">
							<span class="text-muted-foreground">Business</span>
							<span>{data.project.onboarding.businessName}</span>
						</div>
						<div class="space-y-1">
							<p class="text-muted-foreground">Project goals</p>
							<p class="leading-relaxed">{data.project.onboarding.projectGoals}</p>
						</div>
						{#if data.project.onboarding.pagesNeeded}
							<div class="space-y-1">
								<p class="text-muted-foreground">Deliverables</p>
								<p class="leading-relaxed">{data.project.onboarding.pagesNeeded}</p>
							</div>
						{/if}
						{#if data.project.onboarding.brandNotes}
							<div class="space-y-1">
								<p class="text-muted-foreground">Brand notes</p>
								<p class="leading-relaxed">{data.project.onboarding.brandNotes}</p>
							</div>
						{/if}
						{#if data.project.onboarding.domainStatus}
							<div class="flex items-center justify-between gap-4">
								<span class="text-muted-foreground">Domain</span>
								<span>{domainStatusLabels[data.project.onboarding.domainStatus]}</span>
							</div>
						{/if}
						{#if data.project.onboarding.hostingPreference}
							<div class="flex items-center justify-between gap-4">
								<span class="text-muted-foreground">Hosting</span>
								<span>{hostingLabels[data.project.onboarding.hostingPreference]}</span>
							</div>
						{/if}
						{#if data.project.onboarding.additionalNotes}
							<div class="space-y-1">
								<p class="text-muted-foreground">Additional notes</p>
								<p class="leading-relaxed">{data.project.onboarding.additionalNotes}</p>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/if}

			<PmDocumentChecklistCard
				projectId={data.project.id}
				items={data.checklistItems}
				checklistForm={data.checklistForm}
				filesByItem={data.filesByItem}
			/>

			<PmDeliveryMilestonesCard milestones={data.milestones} milestoneForm={data.milestoneForm} />

			<PmDeliveryActivityCard activity={data.activity} activityCommentForm={data.activityCommentForm} />
		</div>

		<div class="flex flex-col gap-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>Document portal</Card.Title>
					<Card.Description>
						Email your client a secure link to upload checklist documents.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<form method="POST" action="?/sendDocumentInvite" use:enhanceDocumentInvite class="space-y-4">
						<div class="space-y-2">
							<Label for="documentClientEmail">Client email</Label>
							<Input
								id="documentClientEmail"
								name="clientEmail"
								type="email"
								bind:value={$documentInviteForm.clientEmail}
							/>
						</div>
						<div class="space-y-2">
							<Label for="documentClientName">Client name (optional)</Label>
							<Input
								id="documentClientName"
								name="clientName"
								bind:value={$documentInviteForm.clientName}
							/>
						</div>
						<Button type="submit" class="h-10 w-full" disabled={documentInviteSubmitting}>
							{documentInviteSubmitting ? 'Sending…' : 'Send document portal invite'}
						</Button>
					</form>

					{#if data.checklistItems.length > 0}
						<form
							method="POST"
							action="?/sendDocumentReminder"
							use:enhance={() => {
								documentReminderSubmitting = true;
								return async ({ result }) => {
									documentReminderSubmitting = false;
									if (result.type === 'success') {
										toast.success('Reminder sent', {
											description: PM_DOCUMENT_REMINDER_SENT_MESSAGE
										});
										await invalidateAll();
									} else if (result.type === 'failure') {
										toast.error('Could not send reminder', {
											description: PM_DOCUMENT_REMINDER_FAILED_MESSAGE
										});
									}
								};
							}}
							class="mt-3"
						>
							<input type="hidden" name="clientEmail" value={$documentInviteForm.clientEmail} />
							<input type="hidden" name="clientName" value={$documentInviteForm.clientName} />
							<Button
								type="submit"
								variant="outline"
								class="h-10 w-full"
								disabled={documentReminderSubmitting || !$documentInviteForm.clientEmail}
							>
								{documentReminderSubmitting ? 'Sending…' : 'Send reminder'}
							</Button>
						</form>
					{/if}

					{#if typeof $documentInviteMessage === 'string' && $documentInviteMessage.length > 0}
						<div class="mt-4">
							{#if $documentInviteMessage === PM_DOCUMENT_INVITE_SENT_MESSAGE}
								<StatusAlert
									variant="success"
									title="Invitation sent"
									description={PM_DOCUMENT_INVITE_SENT_MESSAGE}
								/>
							{:else}
								<StatusAlert
									variant="danger"
									title="Could not send invitation"
									description={$documentInviteMessage}
								/>
							{/if}
						</div>
					{/if}

					{#if data.documentInvitations.length > 0}
						<div class="mt-6 space-y-3">
							<p class="text-muted-foreground text-sm font-medium">Recent document invitations</p>
							{#each data.documentInvitations as invitation (invitation.id)}
								<div class="rounded-lg border p-3 text-sm">
									<p class="font-medium">{invitation.clientEmail}</p>
									<p class="text-muted-foreground mt-1">
										{invitationStatusLabels[invitation.status]} · expires {formatDateTime(
											invitation.expiresAt
										)}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Client onboarding</Card.Title>
					<Card.Description>
						Email your client a secure link to complete the onboarding form.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					{#if data.project.onboarding}
						<StatusAlert
							variant="success"
							title="Onboarding completed"
							description="The client has already submitted their onboarding form."
						/>
					{:else}
						<form method="POST" action="?/sendInvite" use:enhanceInvite class="space-y-4">
							<div class="space-y-2">
								<Label for="clientEmail">Client email</Label>
								<Input
									id="clientEmail"
									name="clientEmail"
									type="email"
									bind:value={$inviteForm.clientEmail}
								/>
							</div>
							<div class="space-y-2">
								<Label for="clientName">Client name (optional)</Label>
								<Input id="clientName" name="clientName" bind:value={$inviteForm.clientName} />
							</div>
							<Button type="submit" class="h-10 w-full" disabled={inviteSubmitting}>
								{#if inviteSubmitting}
									<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
									Sending…
								{:else}
									<MailIcon class="size-4" aria-hidden="true" />
									Send onboarding invite
								{/if}
							</Button>
						</form>
					{/if}

					{#if data.invitations.length > 0}
						<div class="mt-6 space-y-3">
							<p class="text-muted-foreground text-sm font-medium">Recent invitations</p>
							{#each data.invitations as invitation (invitation.id)}
								<div class="rounded-lg border p-3 text-sm">
									<p class="font-medium">{invitation.clientEmail}</p>
									<p class="text-muted-foreground mt-1">
										{invitationStatusLabels[invitation.status]} · expires {formatDateTime(
											invitation.expiresAt
										)}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Update status</Card.Title>
					<Card.Description>Move this project through your delivery workflow.</Card.Description>
				</Card.Header>
				<Card.Content>
					<form method="POST" action="?/updateStatus" use:enhanceStatus class="space-y-4">
						<div class="space-y-2">
							<Label for="status">Status</Label>
							<select
								id="status"
								name="status"
								bind:value={$statusForm.status}
								class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
							>
								{#each Object.entries(statusLabels) as [value, label] (value)}
									<option {value}>{label}</option>
								{/each}
							</select>
						</div>
						<Button type="submit" class="h-10 w-full" disabled={statusSubmitting}>
							{#if statusSubmitting}
								<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
								Saving…
							{:else}
								Save status
							{/if}
						</Button>
					</form>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
