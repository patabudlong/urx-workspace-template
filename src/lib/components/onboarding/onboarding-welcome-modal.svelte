<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { dismissOnboardingWelcome } from '$lib/onboarding/welcome';
	import { ONBOARDING_FEATURE_TOUR } from '$lib/shared/workspace-constants';
	import { cn } from '$lib/utils.js';
	import BriefcaseIcon from '@lucide/svelte/icons/briefcase';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import UsersIcon from '@lucide/svelte/icons/users';

	let {
		open = $bindable(false),
		firstName = ''
	}: {
		open?: boolean;
		firstName?: string;
	} = $props();

	const featureIcons = {
		briefcase: BriefcaseIcon,
		users: UsersIcon,
		'clipboard-list': ClipboardListIcon,
		'trending-up': TrendingUpIcon
	} as const;

	let tourIndex = $state(0);

	const tourItem = $derived(ONBOARDING_FEATURE_TOUR[tourIndex]);
	const TourIcon = $derived(featureIcons[tourItem.icon]);
	const isLastSlide = $derived(tourIndex >= ONBOARDING_FEATURE_TOUR.length - 1);

	$effect(() => {
		if (open) {
			tourIndex = 0;
		}
	});

	function closeWelcome(markDismissed: boolean) {
		if (markDismissed) {
			dismissOnboardingWelcome();
		}

		open = false;
	}

	function nextSlide() {
		if (isLastSlide) {
			closeWelcome(true);
			return;
		}

		tourIndex += 1;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class={cn(
			'gap-0 overflow-hidden p-0',
			tourItem.imageSrc ? 'sm:max-w-3xl' : 'sm:max-w-2xl'
		)}
	>
		<div class="space-y-5 p-6 sm:p-8">
			<Dialog.Header class="space-y-2 text-left">
				<Dialog.Title class="text-xl sm:text-2xl">
					Welcome{firstName ? `, ${firstName}` : ''}
				</Dialog.Title>
				<Dialog.Description>
					A quick look at what you can do in Urixoft Workspace.
				</Dialog.Description>
			</Dialog.Header>

			<div class="flex items-center gap-2">
				{#each ONBOARDING_FEATURE_TOUR as _, index}
					<div
						class={cn(
							'h-1.5 flex-1 rounded-full transition-colors',
							index <= tourIndex ? 'bg-primary' : 'bg-muted'
						)}
					></div>
				{/each}
			</div>

			{#if tourItem.imageSrc}
				<div class="flex flex-col gap-5 sm:flex-row sm:items-center">
					<div class="flex shrink-0 justify-start sm:w-[42%]">
						<img
							src={tourItem.imageSrc}
							alt={tourItem.imageAlt ?? tourItem.title}
							class="h-auto w-full max-w-[220px] object-contain object-left sm:max-w-full"
							width="320"
							height="320"
							draggable="false"
						/>
					</div>
					<div class="min-w-0 flex-1 space-y-2 sm:py-1">
						<h3 class="text-lg font-semibold tracking-tight">{tourItem.title}</h3>
						<p class="text-muted-foreground text-sm leading-relaxed">{tourItem.description}</p>
						<p class="text-muted-foreground text-xs">
							{tourIndex + 1} of {ONBOARDING_FEATURE_TOUR.length}
						</p>
					</div>
				</div>
			{:else}
				<div class="flex flex-col gap-4 sm:flex-row sm:items-start">
					<div
						class="bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-xl"
					>
						<TourIcon class="size-7" />
					</div>
					<div class="min-w-0 flex-1 space-y-2">
						<h3 class="text-lg font-semibold tracking-tight">{tourItem.title}</h3>
						<p class="text-muted-foreground text-sm leading-relaxed">{tourItem.description}</p>
						<p class="text-muted-foreground text-xs">
							{tourIndex + 1} of {ONBOARDING_FEATURE_TOUR.length}
						</p>
					</div>
				</div>
			{/if}
		</div>

		<div
			class="bg-muted/30 flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
			role="group"
			aria-label="Welcome tour navigation"
		>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="order-2 sm:order-1"
				onclick={() => closeWelcome(true)}
			>
				Skip tour
			</Button>
			<div class="order-1 flex flex-wrap justify-end gap-2 sm:order-2">
				{#if tourIndex > 0}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={() => {
							tourIndex -= 1;
						}}
					>
						Back
					</Button>
				{/if}
				<Button type="button" size="sm" onclick={nextSlide}>
					{isLastSlide ? 'Get started' : 'Next'}
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
