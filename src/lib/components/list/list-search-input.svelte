<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { cn } from '$lib/utils.js';
	import SearchIcon from '@lucide/svelte/icons/search';

	let {
		value = $bindable(''),
		placeholder = 'Search...',
		ariaLabel = 'Search',
		class: className
	}: {
		value?: string;
		placeholder?: string;
		ariaLabel?: string;
		class?: string;
	} = $props();
</script>

<InputGroup.Root
	class={cn(
		'border-border bg-muted/40 h-10 w-full border sm:w-52 lg:w-60',
		className
	)}
>
	<InputGroup.Addon align="inline-start" class="text-muted-foreground">
		<SearchIcon class="size-4 opacity-60" aria-hidden="true" />
	</InputGroup.Addon>
	<InputGroup.Input
		type="search"
		{placeholder}
		aria-label={ariaLabel}
		class="h-10"
		bind:value
	/>
</InputGroup.Root>
