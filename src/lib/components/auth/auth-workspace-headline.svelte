<script lang="ts">
	import { AUTH_WORKSPACE_HEADLINE_ITEMS } from '$lib/shared/site-meta';
	import { onMount, tick } from 'svelte';

	const ROTATION_MS = 3500;
	const TRANSITION_MS = 320;
	const ITEM_COUNT = AUTH_WORKSPACE_HEADLINE_ITEMS.length;
	const longestPhrase = AUTH_WORKSPACE_HEADLINE_ITEMS.reduce<string>(
		(longest, item) => (item.phrase.length > longest.length ? item.phrase : longest),
		AUTH_WORKSPACE_HEADLINE_ITEMS[0].phrase
	);

	let index = $state(0);
	let motionEnabled = $state(false);
	let tabVisible = $state(true);
	let phraseEl = $state<HTMLSpanElement | null>(null);
	let rotating = $state(false);
	let phase = $state<'idle' | 'exit' | 'enter'>('idle');

	const currentItem = $derived(AUTH_WORKSPACE_HEADLINE_ITEMS[index]);

	function waitForTransition(el: HTMLElement): Promise<void> {
		return new Promise((resolve) => {
			let settled = false;

			const finish = () => {
				if (settled) return;
				settled = true;
				el.removeEventListener('transitionend', onEnd);
				window.clearTimeout(fallbackId);
				resolve();
			};

			const onEnd = (event: TransitionEvent) => {
				if (event.target !== el || event.propertyName !== 'transform') return;
				finish();
			};

			const fallbackId = window.setTimeout(finish, TRANSITION_MS + 80);
			el.addEventListener('transitionend', onEnd);
		});
	}

	async function rotatePhrase() {
		const el = phraseEl;
		if (!el || rotating || !motionEnabled || !tabVisible) return;

		rotating = true;
		phase = 'exit';

		await waitForTransition(el);

		index = (index + 1) % ITEM_COUNT;
		phase = 'enter';

		await tick();
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});

		phase = 'idle';
		await waitForTransition(el);

		rotating = false;
	}

	onMount(() => {
		const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
		const syncMotion = () => {
			motionEnabled = !motionMedia.matches;
		};
		syncMotion();
		motionMedia.addEventListener('change', syncMotion);

		const onVisibilityChange = () => {
			tabVisible = document.visibilityState === 'visible';
		};
		document.addEventListener('visibilitychange', onVisibilityChange);

		const intervalId = window.setInterval(() => {
			void rotatePhrase();
		}, ROTATION_MS);

		return () => {
			motionMedia.removeEventListener('change', syncMotion);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.clearInterval(intervalId);
		};
	});
</script>

<h1
	class="text-primary-foreground flex w-full max-w-none flex-col text-left text-4xl font-semibold tracking-tight xl:text-5xl"
>
	<span class="block leading-[1.15]">
		Your
		<span
			class="phrase-rotator relative ml-1 inline-grid justify-items-start overflow-hidden text-left align-bottom"
		>
			<span class="invisible col-start-1 row-start-1 whitespace-nowrap text-left" aria-hidden="true">
				{longestPhrase}
			</span>
			<span
				bind:this={phraseEl}
				class="phrase-text col-start-1 row-start-1 whitespace-nowrap text-left"
				class:phrase-exit={phase === 'exit'}
				class:phrase-enter={phase === 'enter'}
				style:--phrase-from={currentItem.from}
				style:--phrase-to={currentItem.to}
			>
				{currentItem.phrase}
			</span>
		</span>
	</span>
	<span class="block leading-[1.15] whitespace-nowrap">
		workspace,
		<span class="underline decoration-skip-ink-auto underline-offset-[0.3em]">made simple.</span>
	</span>
</h1>

<style>
	.phrase-rotator {
		contain: layout style;
		justify-items: start;
	}

	.phrase-text {
		background-image: linear-gradient(90deg, var(--phrase-from), var(--phrase-to));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		transform: translate3d(0, 0, 0);
		opacity: 1;
		transition:
			transform var(--phrase-transition-ms, 320ms) ease,
			opacity var(--phrase-transition-ms, 320ms) ease;
	}

	.phrase-text.phrase-exit,
	.phrase-text.phrase-enter {
		will-change: transform, opacity;
	}

	.phrase-text.phrase-exit {
		transform: translate3d(0, -0.65em, 0);
		opacity: 0;
	}

	.phrase-text.phrase-enter {
		transform: translate3d(0, 0.65em, 0);
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.phrase-text {
			transition: none;
		}
	}
</style>
