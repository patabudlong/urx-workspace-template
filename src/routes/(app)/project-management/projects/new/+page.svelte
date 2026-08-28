<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import PmProjectFormFields from '$lib/components/project-management/pm-project-form-fields.svelte';
	import PmProjectFormShell from '$lib/components/project-management/pm-project-form-shell.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { PM_PROJECT_CREATE_FAILED_MESSAGE } from '$lib/shared/project-management/messages';
	import { pmProjectFormSchema } from '$lib/shared/project-management/schemas';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let submitting = $state(false);

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

	$effect(() => {
		if (typeof $formMessage !== 'string' || $formMessage.length === 0) {
			return;
		}

		toast.error('Could not create project', {
			description:
				$formMessage === PM_PROJECT_CREATE_FAILED_MESSAGE
					? PM_PROJECT_CREATE_FAILED_MESSAGE
					: $formMessage
		});
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Project Management"
		title="New project"
		description="Create a client project to track onboarding and delivery."
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

	<form method="POST" use:enhance class="max-w-3xl">
		<PmProjectFormShell
			title="Set up your project"
			description="Organize the engagement in a few quick sections. You can invite the client for onboarding after the project is created."
		>
			<PmProjectFormFields bind:form={$form} idPrefix="new-" members={data.members} />
			{#snippet actions()}
				<p class="text-muted-foreground text-sm">All fields save to this workspace immediately.</p>
				<div class="flex flex-wrap gap-2">
					<Button href="/project-management/projects" variant="outline" class="h-10">Cancel</Button>
					<Button type="submit" class="h-10" disabled={submitting}>
						{#if submitting}
							Creating…
						{:else}
							Create project
						{/if}
					</Button>
				</div>
			{/snippet}
		</PmProjectFormShell>
	</form>
</div>
