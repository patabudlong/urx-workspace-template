<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ACCOUNTING_JOURNAL_SOURCE_LABELS } from '$lib/shared/accounting/journal-sources';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { goto } from '$app/navigation';

	let { data } = $props();

	function onPeriodChange(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		const url = new URL(window.location.href);

		if (value) {
			url.searchParams.set('periodId', value);
		} else {
			url.searchParams.delete('periodId');
		}

		void goto(`${url.pathname}${url.search}`, { invalidateAll: true });
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Accounting"
		title="Journal entries"
		description="Posted manual journals for the selected fiscal period."
	>
		{#snippet actions()}
			<Button href="/accounting/journals/new" class="h-10">
				<PlusIcon class="size-4" aria-hidden="true" />
				New journal
			</Button>
		{/snippet}
	</PageHeader>

	<div class="flex flex-wrap items-center gap-3">
		<label class="text-sm font-medium" for="period-filter">Fiscal period</label>
		<select
			id="period-filter"
			class="border-input bg-background h-10 rounded-md border px-3 text-sm"
			value={data.selectedPeriodId ?? ''}
			onchange={onPeriodChange}
		>
			<option value="">All periods</option>
			{#each data.periods as period (period.id)}
				<option value={period.id}>{period.label} ({period.status})</option>
			{/each}
		</select>
	</div>

	<div class="rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Date</Table.Head>
					<Table.Head>Source</Table.Head>
					<Table.Head>Reference</Table.Head>
					<Table.Head>Memo</Table.Head>
					<Table.Head>Lines</Table.Head>
					<Table.Head class="text-right">Action</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.entries as entry (entry.id)}
					<Table.Row>
						<Table.Cell>{entry.entryDate}</Table.Cell>
						<Table.Cell>
							<Badge variant={entry.source === 'opening_balance' ? 'default' : 'secondary'}>
								{ACCOUNTING_JOURNAL_SOURCE_LABELS[entry.source]}
							</Badge>
						</Table.Cell>
						<Table.Cell class="font-mono">{entry.reference || '—'}</Table.Cell>
						<Table.Cell class="max-w-xs truncate">{entry.memo || '—'}</Table.Cell>
						<Table.Cell>
							<Badge variant="secondary">{entry.lines.length}</Badge>
						</Table.Cell>
						<Table.Cell class="text-right">
							<Button href={`/accounting/journals/${entry.id}`} variant="outline" size="sm">
								View
							</Button>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={6} class="text-muted-foreground py-8 text-center">
							No journal entries yet.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
