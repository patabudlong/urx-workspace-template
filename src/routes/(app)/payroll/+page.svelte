<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import CalendarRangeIcon from '@lucide/svelte/icons/calendar-range';

	let { data } = $props();

	let runCount = $state<number | null>(null);

	$effect(() => {
		const next = data.runCount as Promise<number> | number;

		if (typeof next === 'number') {
			runCount = next;
			return;
		}

		if (!next || typeof next.then !== 'function') {
			runCount = 0;
			return;
		}

		runCount = null;

		void next.then((resolved) => {
			runCount = resolved;
		});
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Overview"
		description="Track pay periods and compensation runs for your workspace. Create pay runs to calculate and record employee payments."
	>
		{#snippet actions()}
			<Button href="/payroll/runs" variant="outline" class="h-10">
				<CalendarRangeIcon class="size-4" aria-hidden="true" />
				View pay runs
			</Button>
		{/snippet}
	</PageHeader>

	<Card.Root>
		<Card.Header>
			<Card.Title>Pay runs</Card.Title>
			<Card.Description>Total payroll runs recorded for this workspace.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if runCount === null}
				<Skeleton class="h-9 w-16" />
			{:else}
				<p class="text-3xl font-semibold tracking-tight">{runCount}</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
