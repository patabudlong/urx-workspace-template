<script lang="ts">
	import type { TeamPermissionLevel } from '$lib/shared/team/role-permissions';
	import CheckIcon from '@lucide/svelte/icons/check';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import { cn } from '$lib/utils.js';

	let {
		level,
		class: className
	}: {
		level: TeamPermissionLevel;
		class?: string;
	} = $props();
</script>

<span
	class={cn(
		'inline-flex items-center justify-center',
		level === 'yes' && 'text-emerald-600 dark:text-emerald-400',
		level === 'limited' && 'text-amber-600 dark:text-amber-400',
		level === 'no' && 'text-muted-foreground/60',
		className
	)}
>
	{#if level === 'yes'}
		<CheckIcon class="size-4" aria-hidden="true" />
		<span class="sr-only">Yes</span>
	{:else if level === 'limited'}
		<span class="text-xs font-medium">Limited</span>
	{:else}
		<MinusIcon class="size-4" aria-hidden="true" />
		<span class="sr-only">No</span>
	{/if}
</span>
