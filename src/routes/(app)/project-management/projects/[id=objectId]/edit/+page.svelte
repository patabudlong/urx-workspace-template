<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import PmDeleteProjectDialog from '$lib/components/project-management/pm-delete-project-dialog.svelte';
	import PmProjectFormFields from '$lib/components/project-management/pm-project-form-fields.svelte';
	import PmProjectFormShell from '$lib/components/project-management/pm-project-form-shell.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { PM_PROJECT_UPDATE_FAILED_MESSAGE } from '$lib/shared/project-management/messages';
	import { pmProjectFormSchema } from '$lib/shared/project-management/schemas';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let submitting = $state(false);
	let deleting = $state(false);
	let deleteDialogOpen = $state(false);

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

		toast.error('Could not update project', {
			description:
				$formMessage === PM_PROJECT_UPDATE_FAILED_MESSAGE
					? PM_PROJECT_UPDATE_FAILED_MESSAGE
					: $formMessage
		});
	});

	const deleteEnhance: SubmitFunction = () => {
		deleting = true;
		deleteDialogOpen = false;

		return async ({ update }) => {
			await update();
			deleting = false;
		};
	};
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Project Management"
		title="Edit project"
		description="Update details for {data.project.title}."
	>
		{#snippet actions()}
			<Button href="/project-management/projects/{data.project.id}" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to project
			</Button>
		{/snippet}
	</PageHeader>

	{#if typeof $formMessage === 'string' && $formMessage.length > 0}
		<StatusAlert
			variant="danger"
			title="Could not update project"
			description={$formMessage === PM_PROJECT_UPDATE_FAILED_MESSAGE
				? PM_PROJECT_UPDATE_FAILED_MESSAGE
				: $formMessage}
		/>
	{/if}

	<form method="POST" action="?/update" use:enhance class="max-w-3xl">
		<PmProjectFormShell
			title="Edit project details"
			description="Changes apply immediately across the workspace and update what clients see on onboarding."
		>
			<PmProjectFormFields bind:form={$form} idPrefix="edit-" />
			{#snippet actions()}
				<PmDeleteProjectDialog
					bind:open={deleteDialogOpen}
					projectTitle={data.project.title}
					submitting={deleting}
					enhanceAction={deleteEnhance}
				/>
				<div class="flex flex-wrap gap-2">
					<Button
						href="/project-management/projects/{data.project.id}"
						variant="outline"
						class="h-10"
						disabled={submitting || deleting}
					>
						Cancel
					</Button>
					<Button type="submit" class="h-10" disabled={submitting || deleting}>
						{#if submitting}
							Saving…
						{:else}
							Save changes
						{/if}
					</Button>
				</div>
			{/snippet}
		</PmProjectFormShell>
	</form>
</div>
