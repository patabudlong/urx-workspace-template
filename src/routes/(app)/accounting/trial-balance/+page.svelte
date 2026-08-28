<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { formatPhpFromCents } from '$lib/shared/accounting/money';
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
		title="Trial balance"
		description="Period activity grouped by account. Balances reflect debits and credits posted in the selected fiscal period."
	/>

	<div class="flex flex-wrap items-center gap-3">
		<label class="text-sm font-medium" for="trial-period">Fiscal period</label>
		<select
			id="trial-period"
			class="border-input bg-background h-10 rounded-md border px-3 text-sm"
			value={data.selectedPeriodId ?? ''}
			onchange={onPeriodChange}
		>
			{#each data.periods as period (period.id)}
				<option value={period.id}>{period.label} ({period.status})</option>
			{/each}
		</select>
	</div>

	<div class="rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Code</Table.Head>
					<Table.Head>Account</Table.Head>
					<Table.Head class="text-right">Debit</Table.Head>
					<Table.Head class="text-right">Credit</Table.Head>
					<Table.Head class="text-right">Balance</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if data.trialBalance}
					{#each data.trialBalance.rows as row (row.accountId)}
						<Table.Row>
							<Table.Cell class="font-mono">{row.accountCode}</Table.Cell>
							<Table.Cell>{row.accountName}</Table.Cell>
							<Table.Cell class="text-right font-mono">
								{row.debitCents > 0 ? formatPhpFromCents(row.debitCents) : '—'}
							</Table.Cell>
							<Table.Cell class="text-right font-mono">
								{row.creditCents > 0 ? formatPhpFromCents(row.creditCents) : '—'}
							</Table.Cell>
							<Table.Cell class="text-right font-mono">
								{formatPhpFromCents(row.balanceCents)}
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="text-muted-foreground py-8 text-center">
								No activity for this period yet.
							</Table.Cell>
						</Table.Row>
					{/each}
					<Table.Row>
						<Table.Cell colspan={2} class="font-semibold">Totals</Table.Cell>
						<Table.Cell class="text-right font-mono font-semibold">
							{formatPhpFromCents(data.trialBalance.totalDebitCents)}
						</Table.Cell>
						<Table.Cell class="text-right font-mono font-semibold">
							{formatPhpFromCents(data.trialBalance.totalCreditCents)}
						</Table.Cell>
						<Table.Cell />
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={5} class="text-muted-foreground py-8 text-center">
							Select a fiscal period to view the trial balance.
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
</div>
