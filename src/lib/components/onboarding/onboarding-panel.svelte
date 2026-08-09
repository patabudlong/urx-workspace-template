<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		actions,
		children
	}: {
		title: string;
		description?: string;
		actions?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
	<div class="space-y-6 lg:space-y-8">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="max-w-3xl space-y-2">
				<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
				{#if description}
					<p class="text-muted-foreground text-sm leading-relaxed sm:text-base">{description}</p>
				{/if}
			</div>
			{#if actions}
				<div class="shrink-0">
					{@render actions()}
				</div>
			{/if}
		</div>

		<div class="space-y-6">
			{@render children()}
		</div>
	</div>
</div>
