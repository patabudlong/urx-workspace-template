<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import CalendarRangeIcon from '@lucide/svelte/icons/calendar-range';
	import UsersIcon from '@lucide/svelte/icons/users';

	let { data } = $props();

	let runCount = $state<number | null>(null);
	let employeeCount = $state<number | null>(null);

	$effect(() => {
		const nextRunCount = data.runCount as Promise<number> | number;
		const nextEmployeeCount = data.employeeCount as Promise<number> | number;

		if (typeof nextRunCount === 'number') {
			runCount = nextRunCount;
		} else if (nextRunCount && typeof nextRunCount.then === 'function') {
			runCount = null;
			void nextRunCount.then((resolved) => {
				runCount = resolved;
			});
		} else {
			runCount = 0;
		}

		if (typeof nextEmployeeCount === 'number') {
			employeeCount = nextEmployeeCount;
		} else if (nextEmployeeCount && typeof nextEmployeeCount.then === 'function') {
			employeeCount = null;
			void nextEmployeeCount.then((resolved) => {
				employeeCount = resolved;
			});
		} else {
			employeeCount = 0;
		}
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Overview"
		description="Track employees and pay runs for your workspace. Add employees first, then create draft pay runs for each period."
	>
		{#snippet actions()}
			<Button href="/payroll/employees" variant="outline" class="h-10">
				<UsersIcon class="size-4" aria-hidden="true" />
				Employees
			</Button>
			<Button href="/payroll/runs" class="h-10">
				<CalendarRangeIcon class="size-4" aria-hidden="true" />
				Pay runs
			</Button>
		{/snippet}
	</PageHeader>

	<div class="grid gap-6 md:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>Employees</Card.Title>
				<Card.Description>Active people on payroll for this workspace.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if employeeCount === null}
					<Skeleton class="h-9 w-16" />
				{:else}
					<p class="text-3xl font-semibold tracking-tight">{employeeCount}</p>
				{/if}
			</Card.Content>
		</Card.Root>

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
</div>
