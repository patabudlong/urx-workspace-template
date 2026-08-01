<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button/index.js';
	import XIcon from '@lucide/svelte/icons/x';

	export type ElementTourStep = {
		target?: string;
		title: string;
		description: string;
		placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
	};

	let {
		steps,
		active = $bindable(true),
		stepKey = '',
		onDismiss
	}: {
		steps: ElementTourStep[];
		active?: boolean;
		stepKey?: string;
		onDismiss?: () => void;
	} = $props();

	const SPOTLIGHT_PADDING = 8;
	const POPOVER_GAP = 14;

	let currentIndex = $state(0);
	let targetRect = $state<DOMRect | null>(null);
	let popoverSize = $state({ width: 320, height: 180 });

	const currentStep = $derived(steps[currentIndex]);
	const isLast = $derived(currentIndex >= steps.length - 1);
	const isCentered = $derived(
		!currentStep?.target || currentStep.placement === 'center' || (currentStep.target && !targetRect)
	);

	const popoverPosition = $derived.by(() => {
		const viewportWidth = browser ? window.innerWidth : 1024;
		const viewportHeight = browser ? window.innerHeight : 768;

		if (isCentered || !targetRect) {
			return {
				top: Math.max(16, (viewportHeight - popoverSize.height) / 2),
				left: Math.max(16, (viewportWidth - popoverSize.width) / 2)
			};
		}

		const placement = currentStep?.placement ?? 'bottom';
		let top = 0;
		let left = 0;

		if (placement === 'bottom') {
			top = targetRect.bottom + POPOVER_GAP;
			left = targetRect.left + targetRect.width / 2 - popoverSize.width / 2;
		} else if (placement === 'top') {
			top = targetRect.top - popoverSize.height - POPOVER_GAP;
			left = targetRect.left + targetRect.width / 2 - popoverSize.width / 2;
		} else if (placement === 'left') {
			top = targetRect.top + targetRect.height / 2 - popoverSize.height / 2;
			left = targetRect.left - popoverSize.width - POPOVER_GAP;
		} else {
			top = targetRect.top + targetRect.height / 2 - popoverSize.height / 2;
			left = targetRect.right + POPOVER_GAP;
		}

		const maxLeft = viewportWidth - popoverSize.width - 16;
		const maxTop = viewportHeight - popoverSize.height - 16;

		return {
			top: Math.min(Math.max(16, top), maxTop),
			left: Math.min(Math.max(16, left), maxLeft)
		};
	});

	function measureTarget() {
		if (!browser || !active || !currentStep?.target) {
			targetRect = null;
			return;
		}

		const element = document.querySelector(currentStep.target);
		if (!element) {
			targetRect = null;
			return;
		}

		element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		targetRect = element.getBoundingClientRect();
	}

	function dismiss() {
		active = false;
		onDismiss?.();
	}

	function next() {
		if (isLast) {
			dismiss();
			return;
		}
		currentIndex += 1;
	}

	function back() {
		if (currentIndex > 0) currentIndex -= 1;
	}

	function updatePopoverSize(node: HTMLDivElement) {
		const observer = new ResizeObserver(() => {
			popoverSize = {
				width: node.offsetWidth,
				height: node.offsetHeight
			};
		});
		observer.observe(node);
		popoverSize = {
			width: node.offsetWidth,
			height: node.offsetHeight
		};
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	$effect(() => {
		stepKey;
		currentIndex = 0;
	});

	$effect(() => {
		if (!browser || !active) return;

		currentIndex;
		steps;

		const frame = requestAnimationFrame(() => {
			measureTarget();
		});

		const onLayoutChange = () => measureTarget();
		window.addEventListener('resize', onLayoutChange);
		window.addEventListener('scroll', onLayoutChange, true);

		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', onLayoutChange);
			window.removeEventListener('scroll', onLayoutChange, true);
		};
	});
</script>

{#if active && steps.length > 0 && currentStep}
	<div class="pointer-events-none fixed inset-0 z-[1200]" role="presentation">
		<div class="pointer-events-auto fixed inset-0 z-0" aria-hidden="true"></div>

		{#if targetRect && !isCentered}
			<div
				class="pointer-events-none fixed z-[1] rounded-lg"
				style:top="{targetRect.top - SPOTLIGHT_PADDING}px"
				style:left="{targetRect.left - SPOTLIGHT_PADDING}px"
				style:width="{targetRect.width + SPOTLIGHT_PADDING * 2}px"
				style:height="{targetRect.height + SPOTLIGHT_PADDING * 2}px"
				style:box-shadow="0 0 0 9999px rgba(15, 23, 42, 0.58)"
			></div>
		{:else}
			<div class="pointer-events-auto fixed inset-0 bg-slate-900/60" aria-hidden="true"></div>
		{/if}

		<div
			class={[
				'bg-card border-border pointer-events-auto fixed z-[2] w-[min(22rem,calc(100vw-2rem))] rounded-xl border p-5 shadow-2xl',
				isCentered && 'w-[min(24rem,calc(100vw-2rem))]'
			]}
			style:top="{popoverPosition.top}px"
			style:left="{popoverPosition.left}px"
			role="dialog"
			aria-modal="true"
			aria-labelledby="element-tour-title"
			use:updatePopoverSize
		>
			<div class="mb-2 flex items-center justify-between gap-3">
				<p class="text-primary m-0 text-xs font-bold tracking-wide uppercase">
					Step {currentIndex + 1} of {steps.length}
				</p>
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 inline-flex size-7 items-center justify-center rounded-lg border"
					onclick={dismiss}
					aria-label="Close tour"
				>
					<XIcon class="size-4" />
				</button>
			</div>

			<h3 id="element-tour-title" class="text-foreground mb-2 text-[1.0625rem] font-semibold leading-snug">
				{currentStep.title}
			</h3>
			<p class="text-muted-foreground mb-4 text-sm leading-relaxed">{currentStep.description}</p>

			<div class="flex items-center justify-between gap-3">
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground text-[0.8125rem] font-semibold"
					onclick={dismiss}
				>
					Skip tour
				</button>
				<div class="ml-auto flex items-center gap-2">
					{#if currentIndex > 0}
						<Button type="button" variant="outline" size="sm" onclick={back}>Back</Button>
					{/if}
					<Button type="button" size="sm" onclick={next}>
						{isLast ? 'Got it' : 'Next'}
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
