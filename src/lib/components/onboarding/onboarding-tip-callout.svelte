<script lang="ts">
	import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
	import type { Snippet } from 'svelte';

	let {
		label = 'Tip',
		text,
		children
	}: {
		label?: string;
		text?: string;
		children?: Snippet;
	} = $props();
</script>

<div
		class="border-primary/20 bg-primary/5 grid grid-cols-[auto_1fr] items-start gap-3.5 rounded-xl border p-4 shadow-sm"
>
	<span
		class="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
		aria-hidden="true"
	>
		<LightbulbIcon class="size-[18px]" />
	</span>
	<div class="min-w-0">
		<strong class="text-foreground mb-1 block text-sm font-semibold">{label}</strong>
		<div class="text-muted-foreground text-sm leading-relaxed">
			{#if text}
				<p class="m-0">{text}</p>
			{:else if children}
				{@render children()}
			{/if}
		</div>
	</div>
</div>
