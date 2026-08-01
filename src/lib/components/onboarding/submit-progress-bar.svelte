<script lang="ts">
	let {
		active = false,
		label = 'Loading…'
	}: {
		active?: boolean;
		label?: string;
	} = $props();
</script>

{#if active}
	<div
		class="bg-primary/10 pointer-events-none absolute inset-x-0 top-0 z-10 h-[3px] overflow-hidden"
		role="progressbar"
		aria-label={label}
		aria-busy="true"
	>
		<span class="submit-progress-bar bg-primary block h-full w-[42%] rounded-r-full"></span>
	</div>
{/if}

<style>
	.submit-progress-bar {
		transform: translateX(-100%);
		animation: submit-progress-slide 1.15s ease-in-out infinite;
	}

	@keyframes submit-progress-slide {
		0% {
			transform: translateX(-100%);
		}

		100% {
			transform: translateX(320%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.submit-progress-bar {
			width: 100%;
			border-radius: 0;
			transform: none;
			animation: submit-progress-pulse 1.2s ease-in-out infinite;
		}

		@keyframes submit-progress-pulse {
			0%,
			100% {
				opacity: 0.45;
			}

			50% {
				opacity: 1;
			}
		}
	}
</style>
