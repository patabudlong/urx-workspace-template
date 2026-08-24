<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		open = $bindable(false),
		runTitle,
		isCompleted = false,
		submitting = false,
		enhanceAction
	}: {
		open?: boolean;
		runTitle: string;
		isCompleted?: boolean;
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
	<Trash2Icon class="size-4" aria-hidden="true" />
	Remove pay run
</Button>

<Dialog.Root bind:open>
	<Dialog.Content showCloseButton={false}>
		<Dialog.Header>
			<Dialog.Title>Remove {runTitle}?</Dialog.Title>
			<Dialog.Description>
				{#if isCompleted}
					This will delete all payslips for this run and unlock DTR time records for the pay period.
					Employees will no longer see these payslips.
				{:else}
					This draft pay run will be permanently removed.
				{/if}
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
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Removing...
					{:else}
						Remove pay run
					{/if}
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
