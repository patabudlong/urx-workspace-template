<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import UserMinusIcon from '@lucide/svelte/icons/user-minus';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		open = $bindable(false),
		employeeName,
		submitting = false,
		enhanceAction
	}: {
		open?: boolean;
		employeeName: string;
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
	<UserMinusIcon class="size-4" aria-hidden="true" />
	Deactivate employee
</Button>

<Dialog.Root bind:open>
	<Dialog.Content showCloseButton={false}>
		<Dialog.Header>
			<Dialog.Title>Deactivate {employeeName}?</Dialog.Title>
			<Dialog.Description>
				This employee will be removed from active payroll. You can add them again later as a new
				record if needed.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex-row justify-end gap-2 sm:justify-end">
			<Button type="button" variant="outline" class="h-10" disabled={submitting} onclick={() => (open = false)}>
				Cancel
			</Button>
			<form method="POST" action="?/deactivate" use:enhance={enhanceAction} class="contents">
				<Button
					type="submit"
					variant="destructive"
					class={cn('h-10', submitting && 'pointer-events-none cursor-wait')}
					disabled={submitting}
				>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Deactivating...
					{:else}
						Deactivate
					{/if}
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
