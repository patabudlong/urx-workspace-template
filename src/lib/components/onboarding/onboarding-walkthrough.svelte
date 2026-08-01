<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import type { Snippet } from 'svelte';

	export type WalkthroughStep = {
		id: string;
		title: string;
		description: string;
	};

	let {
		steps,
		currentStepId,
		completedStepIds = [],
		headerActions
	}: {
		steps: WalkthroughStep[];
		currentStepId: string;
		completedStepIds?: string[];
		headerActions?: Snippet;
	} = $props();

	const currentIndex = $derived(steps.findIndex((step) => step.id === currentStepId));
	const progress = $derived(
		steps.length <= 1 ? 0 : Math.round((currentIndex / (steps.length - 1)) * 100)
	);
</script>

<header
	class="walkthrough grid w-full gap-4"
	data-tour="progress-guide"
	aria-label="Onboarding progress"
>
	<div class="flex w-full flex-col items-center gap-3 text-center">
		<div class="space-y-1">
			<p class="text-primary text-xs font-semibold tracking-wide uppercase">Setup guide</p>
			<h2 class="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
				Get your workspace ready
			</h2>
		</div>
		{#if headerActions}
			<div class="flex justify-center">
				{@render headerActions()}
			</div>
		{/if}
	</div>

	<div
		class="bg-muted h-1 w-full overflow-hidden rounded-full"
		role="progressbar"
		aria-valuenow={progress}
		aria-valuemin={0}
		aria-valuemax={100}
	>
		<div class="bg-primary h-full rounded-full transition-[width] duration-300" style:width="{progress}%"></div>
	</div>

	<ol
		class="m-0 flex list-none flex-wrap items-center justify-center gap-x-2 gap-y-2 p-0 sm:gap-x-3 md:flex-nowrap md:gap-x-4"
		aria-label="Onboarding steps"
	>
		{#each steps as step, index (step.id)}
			{@const isComplete = completedStepIds.includes(step.id)}
			{@const isCurrent = step.id === currentStepId}
			<li
				class={[
					'flex shrink-0 items-center gap-2 transition-opacity',
					!isCurrent && !isComplete && 'opacity-50'
				]}
			>
				<span
					class={[
						'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
						isComplete && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
						isCurrent && !isComplete && 'bg-primary text-primary-foreground',
						!isComplete && !isCurrent && 'bg-muted text-muted-foreground'
					]}
					aria-hidden="true"
				>
					{#if isComplete}
						<CheckIcon class="size-3" strokeWidth={3} />
					{:else}
						{index + 1}
					{/if}
				</span>
				<span
					class={[
						'max-w-[7rem] truncate text-xs font-semibold sm:max-w-none md:whitespace-nowrap md:text-sm',
						isCurrent ? 'text-foreground' : 'text-muted-foreground'
					]}
				>
					{step.title}
				</span>
				{#if index < steps.length - 1}
					<span class="text-muted-foreground/40 hidden size-3 sm:block" aria-hidden="true">›</span>
				{/if}
			</li>
		{/each}
	</ol>
</header>
