<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import SquarePenIcon from '@lucide/svelte/icons/square-pen';

	let {
		active = false,
		layout = 'sidebar'
	}: {
		active?: boolean;
		layout?: 'sidebar' | 'inline';
	} = $props();
</script>

{#if layout === 'sidebar'}
	<Button
		href="/mailbox/compose"
		class={cn('h-10 w-full shadow-sm', active && 'ring-primary/30 ring-2')}
		aria-current={active ? 'page' : undefined}
	>
		<SquarePenIcon class="size-4" aria-hidden="true" />
		Compose
	</Button>
{:else}
	<a
		href="/mailbox/compose"
		class={cn(
			'bg-primary text-primary-foreground hover:bg-primary/90 flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium shadow-sm transition-colors',
			active && 'ring-primary/30 ring-2'
		)}
		aria-current={active ? 'page' : undefined}
	>
		<SquarePenIcon class="size-4 shrink-0" aria-hidden="true" />
		<span>Compose</span>
	</a>
{/if}
