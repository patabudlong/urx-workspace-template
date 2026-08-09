<script lang="ts">
	import { cn } from '$lib/utils.js';

	export type OnboardingRoleOption = {
		title: string;
		description: string;
		imageSrc: string;
		imageAlt: string;
	};

	let {
		option,
		selectable = false,
		compact = false,
		onclick,
		class: className
	}: {
		option: OnboardingRoleOption;
		selectable?: boolean;
		compact?: boolean;
		onclick?: () => void;
		class?: string;
	} = $props();
</script>

{#snippet cardContent()}
	<div
		class={cn(
			'flex items-center',
			compact ? 'gap-2' : 'flex-col gap-2 sm:flex-row sm:items-center sm:gap-2'
		)}
	>
		<div class={cn('relative z-10 shrink-0', compact ? '-ml-0.5' : '-ml-0.5 sm:-ml-1')}>
			<img
				src={option.imageSrc}
				alt={option.imageAlt}
				class={cn(
					'pointer-events-none object-contain object-left',
					compact ? 'h-14 w-14 sm:h-16 sm:w-16' : 'h-20 w-auto max-w-[140px] sm:h-24 sm:max-w-full'
				)}
				width="320"
				height="320"
				draggable="false"
			/>
		</div>
		<div class={cn('relative z-0 min-w-0 flex-1', compact ? 'space-y-0.5' : 'space-y-1')}>
			<h3 class={cn('font-semibold', compact ? 'text-sm' : 'text-sm sm:text-base')}>
				{option.title}
			</h3>
			<p class={cn('text-muted-foreground', compact ? 'line-clamp-2 text-xs' : 'text-xs sm:text-sm')}>
				{option.description}
			</p>
		</div>
	</div>
{/snippet}

{#if selectable}
	<button
		type="button"
		class={cn(
			'hover:border-primary/50 hover:bg-muted/40 relative overflow-visible rounded-lg border text-left transition-colors',
			compact ? 'p-3' : 'p-3 sm:p-4',
			className
		)}
		{onclick}
	>
		{@render cardContent()}
	</button>
{:else}
	<div
		class={cn(
			'bg-muted/20 relative overflow-visible rounded-lg border',
			compact ? 'p-3' : 'p-3 sm:p-4',
			className
		)}
	>
		{@render cardContent()}
	</div>
{/if}
