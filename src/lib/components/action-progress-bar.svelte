<script lang="ts">
	import { actionProgress } from '$lib/action-progress.svelte';
	import { cn } from '$lib/utils.js';

	type Props = {
		active?: boolean;
		class?: string;
	};

	let { active, class: className }: Props = $props();

	const isActive = $derived(active ?? actionProgress.active);
</script>

<div
	class={cn(
		'pointer-events-none absolute inset-x-0 top-0 z-50 h-0.5 overflow-hidden',
		className
	)}
	role="progressbar"
	aria-hidden={!isActive}
	aria-valuetext="Loading"
>
	{#if isActive}
		<div class="bg-primary/20 absolute inset-0"></div>
		<div class="action-progress-bar bg-primary absolute inset-y-0 w-1/3"></div>
	{/if}
</div>
