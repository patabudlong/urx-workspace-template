<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { formatPhpFromCents } from '$lib/shared/accounting/money';
	import { ACCOUNTING_JOURNAL_SOURCE_LABELS } from '$lib/shared/accounting/journal-sources';
	import {
		sumJournalLineCredits,
		sumJournalLineDebits
	} from '$lib/shared/accounting/core/journal-validation';

	let { data } = $props();

	const totalDebits = $derived(sumJournalLineDebits(data.entry.lines));
	const totalCredits = $derived(sumJournalLineCredits(data.entry.lines));
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Accounting"
		title="Journal entry"
		description={data.entry.memo || 'Posted manual journal entry.'}
	/>

	<div class="grid gap-4 md:grid-cols-4">
		<div>
			<p class="text-muted-foreground text-sm">Date</p>
			<p class="font-medium">{data.entry.entryDate}</p>
		</div>
		<div>
			<p class="text-muted-foreground text-sm">Reference</p>
			<p class="font-mono font-medium">{data.entry.reference || '—'}</p>
		</div>
		<div>
			<p class="text-muted-foreground text-sm">Source</p>
			<p class="font-medium">{ACCOUNTING_JOURNAL_SOURCE_LABELS[data.entry.source]}</p>
		</div>
		<div>
			<p class="text-muted-foreground text-sm">Status</p>
			<p class="font-medium capitalize">{data.entry.status}</p>
		</div>
		<div>
			<p class="text-muted-foreground text-sm">Posted</p>
			<p class="font-medium">{new Date(data.entry.createdAt).toLocaleString()}</p>
		</div>
	</div>

	<div class="rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Account</Table.Head>
					<Table.Head>Description</Table.Head>
					<Table.Head class="text-right">Debit</Table.Head>
					<Table.Head class="text-right">Credit</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.entry.lines as line (line.accountId + line.debitCents + line.creditCents)}
					<Table.Row>
						<Table.Cell>
							<span class="font-mono">{line.accountCode}</span>
							<span class="text-muted-foreground"> — {line.accountName}</span>
						</Table.Cell>
						<Table.Cell>{line.description || '—'}</Table.Cell>
						<Table.Cell class="text-right font-mono">
							{line.debitCents > 0 ? formatPhpFromCents(line.debitCents) : '—'}
						</Table.Cell>
						<Table.Cell class="text-right font-mono">
							{line.creditCents > 0 ? formatPhpFromCents(line.creditCents) : '—'}
						</Table.Cell>
					</Table.Row>
				{/each}
				<Table.Row>
					<Table.Cell colspan={2} class="font-semibold">Totals</Table.Cell>
					<Table.Cell class="text-right font-mono font-semibold">
						{formatPhpFromCents(totalDebits)}
					</Table.Cell>
					<Table.Cell class="text-right font-mono font-semibold">
						{formatPhpFromCents(totalCredits)}
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</div>
</div>
