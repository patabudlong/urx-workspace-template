<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import OnboardingTipCallout from '$lib/components/onboarding/onboarding-tip-callout.svelte';

	export type WalkthroughStep = {
		id: string;
		title: string;
		description: string;
	};

	let {
		steps,
		currentStepId,
		completedStepIds = []
	}: {
		steps: WalkthroughStep[];
		currentStepId: string;
		completedStepIds?: string[];
	} = $props();

	const currentIndex = $derived(steps.findIndex((step) => step.id === currentStepId));
	const progress = $derived(
		steps.length <= 1 ? 0 : Math.round((currentIndex / (steps.length - 1)) * 100)
	);

	const tipText = $derived.by(() => {
		switch (currentStepId) {
			case 'choose':
				return 'Creating a workspace makes you the owner. Joining requires an invite code from your team admin.';
			case 'workspace':
				return 'Your workspace URL is generated from your company name. You can customize branding later in settings.';
			case 'location':
				return 'Address details help us verify your organization. You can update these anytime.';
			case 'contact':
				return 'We will use this email for workspace notifications and admin review updates.';
			case 'review':
				return 'Review everything before submitting. Admin approval usually takes 1–2 business days.';
			case 'pending':
				return 'You can sign out and return later. Dashboard access unlocks after workspace approval.';
			default:
				return 'Ask your workspace admin for the invite code or workspace slug shown in their dashboard settings.';
		}
	});
</script>

<aside class="walkthrough hidden gap-6 p-8 lg:grid" data-tour="progress-guide" aria-label="Onboarding progress">
	<div class="space-y-2">
		<p class="text-primary text-sm font-semibold">Setup guide</p>
		<h2 class="text-foreground text-2xl font-semibold tracking-tight">Get your workspace ready</h2>
		<p class="text-muted-foreground text-sm leading-relaxed">
			Follow these steps to create or join a team. Most people finish in under 3 minutes.
		</p>
	</div>

	<div
		class="bg-muted h-1.5 overflow-hidden rounded-full"
		role="progressbar"
		aria-valuenow={progress}
		aria-valuemin={0}
		aria-valuemax={100}
	>
		<div class="bg-primary h-full rounded-full transition-[width] duration-300" style:width="{progress}%"></div>
	</div>

	<ol class="m-0 grid list-none gap-3.5 p-0">
		{#each steps as step, index (step.id)}
			{@const isComplete = completedStepIds.includes(step.id)}
			{@const isCurrent = step.id === currentStepId}
			<li
				class={[
					'grid grid-cols-[auto_1fr] gap-3.5 rounded-lg border border-transparent px-4 py-3.5 transition-colors',
					isCurrent && 'bg-card border-border shadow-sm',
					isComplete && 'step-complete'
				]}
			>
				<span
					class={[
						'flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
						isComplete && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
						isCurrent && !isComplete && 'bg-primary text-primary-foreground',
						!isComplete && !isCurrent && 'bg-muted text-muted-foreground'
					]}
					aria-hidden="true"
				>
					{#if isComplete}
						<CheckIcon class="size-3.5" strokeWidth={3} />
					{:else}
						{index + 1}
					{/if}
				</span>
				<div class="min-w-0">
					<strong class="text-foreground block text-sm font-semibold">{step.title}</strong>
					<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{step.description}</p>
				</div>
			</li>
		{/each}
	</ol>

	<OnboardingTipCallout text={tipText} />
</aside>
