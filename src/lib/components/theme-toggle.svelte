<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { toggleMode } from 'mode-watcher';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';

	let {
		class: className,
		iconClass = 'size-4'
	}: { class?: string; iconClass?: string } = $props();
</script>

<Button
	variant="ghost"
	size="icon"
	class={['relative', className]}
	onclick={toggleMode}
	aria-label="Toggle theme"
>
	<SunIcon
		class={cn(iconClass, 'scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90')}
	/>
	<MoonIcon
		class={cn(
			'absolute',
			iconClass,
			'scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0'
		)}
	/>
</Button>
