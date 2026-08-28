<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		open = $bindable(false),
		projectCount = 0,
		submitting = false,
		enhanceAction
	}: {
		open?: boolean;
		projectCount?: number;
		submitting?: boolean;
		enhanceAction: SubmitFunction;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content showCloseButton={false}>
		<Dialog.Header>
			<Dialog.Title>Remove sample data?</Dialog.Title>
			<Dialog.Description>
				This will delete {projectCount} sample projects loaded for exploration. Your own project
				records will not be affected.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex-row justify-end gap-2 sm:justify-end">
			<Button variant="outline" type="button" disabled={submitting} onclick={() => (open = false)}>
				Cancel
			</Button>
			<form method="POST" action="?/deleteSeed" use:enhance={enhanceAction} class="contents">
				<Button
					type="submit"
					variant="destructive"
					disabled={submitting}
					class={cn(submitting && 'pointer-events-none cursor-wait')}
				>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Removing…
					{:else}
						Remove sample data
					{/if}
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
