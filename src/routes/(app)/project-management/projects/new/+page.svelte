<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { PM_PROJECT_CREATE_FAILED_MESSAGE } from '$lib/shared/project-management/messages';
	import { PM_PROJECT_STATUSES } from '$lib/shared/models/pm-project';
	import { pmProjectFormSchema } from '$lib/shared/project-management/schemas';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
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

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(pmProjectFormSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: () => {
			submitting = false;
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Project Management"
		title="New project"
		description="Create a client website project to track onboarding and delivery."
	>
		{#snippet actions()}
			<Button href="/project-management/projects" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to projects
			</Button>
		{/snippet}
	</PageHeader>

	{#if typeof $formMessage === 'string' && $formMessage.length > 0}
		<StatusAlert
			variant="danger"
			title="Could not create project"
			description={$formMessage === PM_PROJECT_CREATE_FAILED_MESSAGE
				? PM_PROJECT_CREATE_FAILED_MESSAGE
				: $formMessage}
		/>
	{/if}

	<form method="POST" use:enhance class="max-w-2xl space-y-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>Project details</Card.Title>
				<Card.Description>Basic information for this client delivery project.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="title">Project title</Label>
					<Input id="title" name="title" bind:value={$form.title} autocomplete="off" />
				</div>

				<div class="space-y-2">
					<Label for="clientName">Client name (optional)</Label>
					<Input id="clientName" name="clientName" bind:value={$form.clientName} autocomplete="organization" />
				</div>

				<div class="space-y-2">
					<Label for="websiteUrl">Website URL (optional)</Label>
					<Input id="websiteUrl" name="websiteUrl" bind:value={$form.websiteUrl} type="url" />
				</div>

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

				<div class="space-y-2">
					<Label for="dueDate">Target launch date (optional)</Label>
					<Input id="dueDate" name="dueDate" bind:value={$form.dueDate} type="date" />
				</div>

				<div class="space-y-2">
					<Label for="description">Description (optional)</Label>
					<Textarea id="description" name="description" bind:value={$form.description} rows={3} />
				</div>

				<div class="space-y-2">
					<Label for="notes">Internal notes (optional)</Label>
					<Textarea id="notes" name="notes" bind:value={$form.notes} rows={3} />
				</div>
			</Card.Content>
			<Card.Footer>
				<Button type="submit" class="h-10" disabled={submitting}>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Creating…
					{:else}
						<ClipboardListIcon class="size-4" aria-hidden="true" />
						Create project
					{/if}
				</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
