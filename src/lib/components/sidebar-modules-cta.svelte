<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import BoxesIcon from '@lucide/svelte/icons/boxes';

	let {
		class: className,
		href = '/modules'
	}: {
		class?: string;
		href?: string;
	} = $props();
</script>

<div
	class={cn(
		'group-data-[collapsible=icon]:hidden mx-2 mb-2 flex flex-col items-center rounded-xl bg-sidebar-accent/60 p-4 text-center',
		className
	)}
>
	<div class="bg-background/80 text-sidebar-foreground mb-3 flex size-14 items-center justify-center rounded-2xl">
		<BoxesIcon class="size-7" aria-hidden="true" />
	</div>

	<p class="text-sm font-semibold text-sidebar-foreground">Workspace modules</p>
	<p class="text-muted-foreground mt-1 text-xs">Choose which tools your team can use</p>

	<Button href={href} class="mt-4 h-9 w-full bg-foreground text-background hover:bg-foreground/90">
		Manage modules
	</Button>
</div>
