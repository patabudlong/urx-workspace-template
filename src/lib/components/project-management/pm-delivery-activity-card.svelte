<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import type { PmProjectActivityDto } from '$lib/shared/models/pm-project-activity';
	import { PM_ACTIVITY_COMMENT_ADDED_MESSAGE } from '$lib/shared/project-management/messages';
	import { pmActivityCommentFormSchema } from '$lib/shared/project-management/schemas';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	let {
		activity,
		activityCommentForm
	}: {
		activity: PmProjectActivityDto[];
		activityCommentForm: import('sveltekit-superforms').SuperValidated<
			import('$lib/shared/project-management/schemas').PmActivityCommentFormInput
		>;
	} = $props();

	let submitting = $state(false);

	const commentSuperform = superForm(untrack(() => activityCommentForm), {
		validators: zod4Client(pmActivityCommentFormSchema),
		resetForm: true,
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: async ({ form }) => {
			submitting = false;
			if (form.message === PM_ACTIVITY_COMMENT_ADDED_MESSAGE) {
				toast.success('Comment added', { description: PM_ACTIVITY_COMMENT_ADDED_MESSAGE });
				await invalidateAll();
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = commentSuperform;

	function formatDateTime(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Activity</Card.Title>
		<Card.Description>Internal updates and comments for your delivery team.</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		{#if typeof $formMessage === 'string' && $formMessage.length > 0 && $formMessage !== PM_ACTIVITY_COMMENT_ADDED_MESSAGE}
			<StatusAlert variant="danger" title="Could not add comment" description={$formMessage} />
		{/if}

		{#if activity.length === 0}
			<p class="text-muted-foreground text-sm">No activity yet.</p>
		{:else}
			<div class="space-y-3">
				{#each activity as entry (entry.id)}
					<div class="rounded-lg border p-3 text-sm">
						<p class="leading-relaxed">{entry.body}</p>
						<p class="text-muted-foreground mt-2 text-xs">
							{entry.actorName ?? 'System'} · {formatDateTime(entry.createdAt)}
						</p>
					</div>
				{/each}
			</div>
		{/if}

		<form method="POST" action="?/addActivityComment" use:enhance class="space-y-4 border-t pt-4">
			<div class="space-y-2">
				<Label for="activity-comment">Add comment</Label>
				<Textarea id="activity-comment" name="body" rows={3} bind:value={$form.body} />
			</div>
			<Button type="submit" disabled={submitting}>
				{submitting ? 'Posting…' : 'Post comment'}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
