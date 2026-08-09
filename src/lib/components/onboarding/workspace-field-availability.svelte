<script lang="ts">
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	export type WorkspaceAvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken';

	let {
		status,
		takenMessage,
		class: className
	}: {
		status: WorkspaceAvailabilityStatus;
		takenMessage: string;
		class?: string;
	} = $props();
</script>

{#if status !== 'idle'}
	<p
		class={cn(
			'mt-1 flex items-center gap-1.5 text-xs',
			status === 'taken' && 'text-destructive',
			status === 'available' && 'text-emerald-600 dark:text-emerald-400',
			status === 'checking' && 'text-muted-foreground',
			className
		)}
		role={status === 'taken' ? 'alert' : 'status'}
	>
		{#if status === 'checking'}
			<Loader2Icon class="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
			Checking availability…
		{:else if status === 'available'}
			<CheckIcon class="size-3.5 shrink-0" aria-hidden="true" />
			Available
		{:else if status === 'taken'}
			{takenMessage}
		{/if}
	</p>
{/if}
