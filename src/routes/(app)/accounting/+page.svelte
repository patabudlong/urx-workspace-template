<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
	import SettingsIcon from '@lucide/svelte/icons/settings';

	let { data } = $props();

	let settingsConfigured = $state<boolean | null>(null);
	let accountCount = $state<number | null>(null);
	let journalCount = $state<number | null>(null);
	let openPeriodCount = $state<number | null>(null);

	function resolvePromise<T>(value: Promise<T> | T, setter: (next: T) => void) {
		if (typeof value === 'object' && value !== null && 'then' in value) {
			setter(null as T);
			void (value as Promise<T>).then(setter);
			return;
		}

		setter(value as T);
	}

	$effect(() => {
		resolvePromise(data.settingsConfigured, (value) => {
			settingsConfigured = value;
		});
		resolvePromise(data.accountCount, (value) => {
			accountCount = value;
		});
		resolvePromise(data.journalCount, (value) => {
			journalCount = value;
		});
		resolvePromise(data.openPeriodCount, (value) => {
			openPeriodCount = value;
		});
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Accounting"
		title="Overview"
		description="Set up your company profile, review the chart of accounts, post manual journals, and run trial balances."
	>
		{#snippet actions()}
			<Button href="/accounting/settings" variant="outline" class="h-10">
				<SettingsIcon class="size-4" aria-hidden="true" />
				Settings
			</Button>
			<Button href="/accounting/opening-balances" variant="outline" class="h-10">
				Opening balances
			</Button>
			<Button href="/accounting/journals/new" class="h-10">
				<FileSpreadsheetIcon class="size-4" aria-hidden="true" />
				New journal
			</Button>
		{/snippet}
	</PageHeader>

	{#if settingsConfigured === false}
		<StatusAlert
			variant="info"
			title="Complete company setup"
			description="Add your company details and fiscal year to seed the PH chart of accounts and fiscal periods."
		/>
		<div>
			<Button href="/accounting/settings" size="sm">Open settings</Button>
		</div>
	{/if}

	<div class="grid gap-6 md:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<Card.Title>Accounts</Card.Title>
				<Card.Description>Active chart of accounts for this workspace.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if accountCount === null}
					<Skeleton class="h-9 w-16" />
				{:else}
					<p class="text-3xl font-semibold tracking-tight">{accountCount}</p>
				{/if}
			</Card.Content>
			<Card.Footer>
				<Button href="/accounting/chart-of-accounts" variant="outline" size="sm">
					<BookOpenIcon class="size-4" />
					View chart
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Journal entries</Card.Title>
				<Card.Description>Posted manual journals in the general ledger.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if journalCount === null}
					<Skeleton class="h-9 w-16" />
				{:else}
					<p class="text-3xl font-semibold tracking-tight">{journalCount}</p>
				{/if}
			</Card.Content>
			<Card.Footer>
				<Button href="/accounting/journals" variant="outline" size="sm">View journals</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Open periods</Card.Title>
				<Card.Description>Fiscal periods available for posting.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if openPeriodCount === null}
					<Skeleton class="h-9 w-16" />
				{:else}
					<p class="text-3xl font-semibold tracking-tight">{openPeriodCount}</p>
				{/if}
			</Card.Content>
			<Card.Footer>
				<Button href="/accounting/periods" variant="outline" size="sm">Manage periods</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</div>
