<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		open = $bindable(false),
		projectTitle,
		submitting = false,
		enhanceAction
	}: {
		open?: boolean;
		projectTitle: string;
		submitting?: boolean;
		enhanceAction: SubmitFunction;
	} = $props();
</script>

<Button
	type="button"
	variant="destructive"
	class="h-10"
	disabled={submitting}
	onclick={() => {
		open = true;
	}}
>
	Delete project
</Button>

<Dialog.Root bind:open>
	<Dialog.Content showCloseButton={false}>
		<Dialog.Header>
			<Dialog.Title>Delete {projectTitle}?</Dialog.Title>
			<Dialog.Description>
				This permanently removes the project, onboarding responses, and invitation history. This
				action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex-row justify-end gap-2 sm:justify-end">
			<Button
				type="button"
				variant="outline"
				class="h-10"
				disabled={submitting}
				onclick={() => (open = false)}
			>
				Cancel
			</Button>
			<form method="POST" action="?/delete" use:enhance={enhanceAction} class="contents">
				<Button
					type="submit"
					variant="destructive"
					class={cn('h-10', submitting && 'pointer-events-none cursor-wait')}
					disabled={submitting}
				>
					{#if submitting}
						Deleting…
					{:else}
						Delete project
					{/if}
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
