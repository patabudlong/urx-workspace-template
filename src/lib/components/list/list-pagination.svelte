<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let {
		page = $bindable(1),
		pageSize,
		total,
		class: className
	}: {
		page?: number;
		pageSize: number;
		total: number;
		class?: string;
	} = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const rangeStart = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
	const rangeEnd = $derived(Math.min(page * pageSize, total));
	const canGoPrevious = $derived(page > 1);
	const canGoNext = $derived(page < totalPages);

	function goToPreviousPage() {
		if (canGoPrevious) {
			page = page - 1;
		}
	}

	function goToNextPage() {
		if (canGoNext) {
			page = page + 1;
		}
	}
</script>

{#if total > pageSize}
	<div
		class={cn(
			'flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between',
			className
		)}
	>
		<p class="text-muted-foreground text-sm">
			Showing {rangeStart}–{rangeEnd} of {total}
		</p>
		<div class="flex items-center gap-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				class="h-8"
				disabled={!canGoPrevious}
				onclick={goToPreviousPage}
				aria-label="Previous page"
			>
				<ChevronLeftIcon class="size-4" aria-hidden="true" />
				Previous
			</Button>
			<span class="text-muted-foreground px-1 text-sm tabular-nums">
				Page {page} of {totalPages}
			</span>
			<Button
				type="button"
				variant="outline"
				size="sm"
				class="h-8"
				disabled={!canGoNext}
				onclick={goToNextPage}
				aria-label="Next page"
			>
				Next
				<ChevronRightIcon class="size-4" aria-hidden="true" />
			</Button>
		</div>
	</div>
{/if}
