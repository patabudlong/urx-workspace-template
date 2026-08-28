<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		PM_PROJECT_UPDATE_FAILED_MESSAGE,
		PM_PROJECT_UPDATED_MESSAGE
	} from '$lib/shared/project-management/messages';
	import { PM_PROJECT_STATUSES } from '$lib/shared/models/pm-project';
	import { pmProjectStatusFormSchema } from '$lib/shared/project-management/schemas';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);

	const statusLabels: Record<string, string> = {
		[PM_PROJECT_STATUSES.PLANNING]: 'Planning',
		[PM_PROJECT_STATUSES.ACTIVE]: 'Active',
		[PM_PROJECT_STATUSES.ON_HOLD]: 'On hold',
		[PM_PROJECT_STATUSES.COMPLETED]: 'Completed',
		[PM_PROJECT_STATUSES.CANCELLED]: 'Cancelled'
	};

	const superform = superForm(untrack(() => data.statusForm), {
		validators: zod4Client(pmProjectStatusFormSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: async ({ form }) => {
			submitting = false;
			if (form.message === PM_PROJECT_UPDATED_MESSAGE) {
				await invalidateAll();
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	function formatDate(value: string | null): string {
		if (!value) {
			return '—';
		}

		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
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
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader eyebrow="Project Management" title={data.project.title} description="Project details and delivery status.">
		{#snippet actions()}
			<Button href="/project-management/projects" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to projects
			</Button>
		{/snippet}
	</PageHeader>

	{#if typeof $formMessage === 'string' && $formMessage.length > 0}
		{#if $formMessage === PM_PROJECT_UPDATED_MESSAGE}
			<StatusAlert variant="success" title="Project updated" description={PM_PROJECT_UPDATED_MESSAGE} />
		{:else}
			<StatusAlert
				variant="danger"
				title="Could not update project"
				description={$formMessage === PM_PROJECT_UPDATE_FAILED_MESSAGE
					? PM_PROJECT_UPDATE_FAILED_MESSAGE
					: $formMessage}
			/>
		{/if}
	{/if}

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
		<Card.Root>
			<Card.Header>
				<Card.Title>Overview</Card.Title>
				<Card.Description>Client and delivery details for this project.</Card.Description>
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
					<span class="text-muted-foreground">Website</span>
					<span class="truncate">{data.project.websiteUrl ?? '—'}</span>
				</div>
				<div class="flex items-center justify-between gap-4">
					<span class="text-muted-foreground">Target launch</span>
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

		<Card.Root>
			<Card.Header>
				<Card.Title>Update status</Card.Title>
				<Card.Description>Move this project through your delivery workflow.</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" action="?/updateStatus" use:enhance class="space-y-4">
					<div class="space-y-2">
						<Label for="status">Status</Label>
						<select
							id="status"
							name="status"
							bind:value={$form.status}
							class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							{#each Object.entries(statusLabels) as [value, label] (value)}
								<option {value}>{label}</option>
							{/each}
						</select>
					</div>
					<Button type="submit" class="h-10 w-full" disabled={submitting}>
						{#if submitting}
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
