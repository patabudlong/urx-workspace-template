<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import type { PmProjectMilestoneDto } from '$lib/shared/models/pm-project-milestone';
	import { PM_PROJECT_MILESTONE_STATUSES } from '$lib/shared/models/pm-project-milestone';
	import {
		PM_MILESTONE_ADDED_MESSAGE,
		PM_MILESTONE_REMOVED_MESSAGE,
		PM_MILESTONE_UPDATED_MESSAGE
	} from '$lib/shared/project-management/messages';
	import { pmMilestoneFormSchema } from '$lib/shared/project-management/schemas';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	let {
		milestones,
		milestoneForm
	}: {
		milestones: PmProjectMilestoneDto[];
		milestoneForm: import('sveltekit-superforms').SuperValidated<
			import('$lib/shared/project-management/schemas').PmMilestoneFormInput
		>;
	} = $props();

	let adding = $state(false);
	let updatingId = $state<string | null>(null);
	let removingId = $state<string | null>(null);

	const statusLabels: Record<string, string> = {
		[PM_PROJECT_MILESTONE_STATUSES.PENDING]: 'Pending',
		[PM_PROJECT_MILESTONE_STATUSES.IN_PROGRESS]: 'In progress',
		[PM_PROJECT_MILESTONE_STATUSES.COMPLETED]: 'Completed'
	};

	const milestoneSuperform = superForm(untrack(() => milestoneForm), {
		validators: zod4Client(pmMilestoneFormSchema),
		resetForm: true,
		onSubmit: () => {
			adding = true;
		},
		onUpdated: async ({ form }) => {
			adding = false;
			if (form.message === PM_MILESTONE_ADDED_MESSAGE) {
				toast.success('Milestone added', { description: PM_MILESTONE_ADDED_MESSAGE });
				await invalidateAll();
			}
		},
		onError: () => {
			adding = false;
		}
	});

	const { enhance: enhanceAdd, form: addForm, message: addMessage } = milestoneSuperform;
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Milestones</Card.Title>
		<Card.Description>Break delivery into trackable steps for your team.</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		{#if typeof $addMessage === 'string' && $addMessage.length > 0 && $addMessage !== PM_MILESTONE_ADDED_MESSAGE}
			<StatusAlert variant="danger" title="Could not add milestone" description={$addMessage} />
		{/if}

		{#if milestones.length === 0}
			<p class="text-muted-foreground text-sm">No milestones yet. Add your first delivery step below.</p>
		{:else}
			<div class="space-y-3">
				{#each milestones as milestone (milestone.id)}
					<div class="rounded-lg border p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<p class="font-medium">{milestone.title}</p>
									<Badge variant="secondary">{statusLabels[milestone.status]}</Badge>
								</div>
								{#if milestone.description}
									<p class="text-muted-foreground text-sm">{milestone.description}</p>
								{/if}
							</div>
							<form
								method="POST"
								action="?/removeMilestone"
								onsubmit={() => {
									removingId = milestone.id;
								}}
								use:enhance={() => {
									return async ({ result }) => {
										removingId = null;
										if (result.type === 'success') {
											toast.success('Milestone removed', {
												description: PM_MILESTONE_REMOVED_MESSAGE
											});
											await invalidateAll();
										}
									};
								}}
							>
								<input type="hidden" name="milestoneId" value={milestone.id} />
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									class="text-destructive"
									disabled={removingId === milestone.id}
								>
									{removingId === milestone.id ? 'Removing…' : 'Remove'}
								</Button>
							</form>
						</div>

						{#if milestone.status !== PM_PROJECT_MILESTONE_STATUSES.COMPLETED}
							<div class="mt-4 flex flex-wrap gap-2">
								{#if milestone.status === PM_PROJECT_MILESTONE_STATUSES.PENDING}
									<form
										method="POST"
										action="?/updateMilestoneStatus"
										onsubmit={() => {
											updatingId = milestone.id;
										}}
										use:enhance={() => {
											return async ({ result }) => {
												updatingId = null;
												if (result.type === 'success') {
													toast.success('Milestone updated', {
														description: PM_MILESTONE_UPDATED_MESSAGE
													});
													await invalidateAll();
												}
											};
										}}
									>
										<input type="hidden" name="milestoneId" value={milestone.id} />
										<input
											type="hidden"
											name="status"
											value={PM_PROJECT_MILESTONE_STATUSES.IN_PROGRESS}
										/>
										<Button type="submit" size="sm" disabled={updatingId === milestone.id}>
											Start
										</Button>
									</form>
								{/if}
								<form
									method="POST"
									action="?/updateMilestoneStatus"
									onsubmit={() => {
										updatingId = milestone.id;
									}}
									use:enhance={() => {
										return async ({ result }) => {
											updatingId = null;
											if (result.type === 'success') {
												toast.success('Milestone updated', {
													description: PM_MILESTONE_UPDATED_MESSAGE
												});
												await invalidateAll();
											}
										};
									}}
								>
									<input type="hidden" name="milestoneId" value={milestone.id} />
									<input
										type="hidden"
										name="status"
										value={PM_PROJECT_MILESTONE_STATUSES.COMPLETED}
									/>
									<Button
										type="submit"
										size="sm"
										variant="outline"
										disabled={updatingId === milestone.id}
									>
										Mark complete
									</Button>
								</form>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<form method="POST" action="?/addMilestone" use:enhanceAdd class="space-y-4 border-t pt-4">
			<p class="text-sm font-medium">Add milestone</p>
			<div class="space-y-2">
				<Label for="milestone-title">Title</Label>
				<Input id="milestone-title" name="title" bind:value={$addForm.title} />
			</div>
			<div class="space-y-2">
				<Label for="milestone-description">Description (optional)</Label>
				<Textarea
					id="milestone-description"
					name="description"
					rows={2}
					bind:value={$addForm.description}
				/>
			</div>
			<Button type="submit" disabled={adding}>{adding ? 'Adding…' : 'Add milestone'}</Button>
		</form>
	</Card.Content>
</Card.Root>
