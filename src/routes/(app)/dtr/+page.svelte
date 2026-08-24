<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import UploadIcon from '@lucide/svelte/icons/upload';

	let { data } = $props();

	let employeeCount = $state<number | null>(null);
	let settingsConfigured = $state<boolean | null>(null);

	$effect(() => {
		const nextEmployeeCount = data.employeeCount as Promise<number> | number;
		const nextSettingsConfigured = data.settingsConfigured as Promise<boolean> | boolean;

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

		if (typeof nextSettingsConfigured === 'boolean') {
			settingsConfigured = nextSettingsConfigured;
		} else if (nextSettingsConfigured && typeof nextSettingsConfigured.then === 'function') {
			settingsConfigured = null;
			void nextSettingsConfigured.then((resolved) => {
				settingsConfigured = resolved;
			});
		} else {
			settingsConfigured = false;
		}
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="DTR"
		title="Overview"
		description="Track daily time records for payroll employees. Configure your work schedule, then manage time records by employee."
	>
		{#snippet actions()}
			<Button href="/dtr/settings" variant="outline" class="h-10">
				<CalendarClockIcon class="size-4" aria-hidden="true" />
				Settings
			</Button>
			<Button href="/dtr/records" class="h-10">
				<ClockIcon class="size-4" aria-hidden="true" />
				Time records
			</Button>
			<Button href="/dtr/import" variant="outline" class="h-10">
				<UploadIcon class="size-4" aria-hidden="true" />
				Upload timecard
			</Button>
		{/snippet}
	</PageHeader>

	<div class="grid gap-6 md:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>Payroll employees</Card.Title>
				<Card.Description>People available for time record tracking.</Card.Description>
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
				<Card.Title>Work schedule</Card.Title>
				<Card.Description>Rest days and standard hours for this workspace.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if settingsConfigured === null}
					<Skeleton class="h-9 w-28" />
				{:else if settingsConfigured}
					<p class="text-3xl font-semibold tracking-tight">Configured</p>
				{:else}
					<p class="text-muted-foreground text-sm">Using default schedule (Sunday rest day).</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
