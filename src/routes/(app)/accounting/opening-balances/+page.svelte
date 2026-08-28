<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let { data } = $props();
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Accounting"
		title="Opening balances"
		description="Post beginning balances to the first fiscal period before other journal entries."
	>
		{#snippet actions()}
			{#if data.canPostOpeningBalance}
				<Button href="/accounting/opening-balances/new" class="h-10">
					<PlusIcon class="size-4" aria-hidden="true" />
					Post opening balance
				</Button>
			{/if}
		{/snippet}
	</PageHeader>

	{#if data.firstPeriod && !data.hasOpeningBalance && data.firstPeriod.status === 'open'}
		<StatusAlert
			variant="info"
			title="Opening balance not posted"
			description="Post your beginning account balances to {data.firstPeriod.label} before recording other activity in that period."
		/>
	{:else if data.hasOpeningBalance}
		<StatusAlert
			variant="success"
			title="Opening balance posted"
			description="Beginning balances are recorded for {data.firstPeriod?.label ?? 'the first fiscal period'}."
		/>
	{/if}

	<div class="rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Date</Table.Head>
					<Table.Head>Period</Table.Head>
					<Table.Head>Reference</Table.Head>
					<Table.Head>Memo</Table.Head>
					<Table.Head class="text-right">Action</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.entries as entry (entry.id)}
					<Table.Row>
						<Table.Cell>{entry.entryDate}</Table.Cell>
						<Table.Cell>
							<Badge variant="secondary">Opening balance</Badge>
						</Table.Cell>
						<Table.Cell class="font-mono">{entry.reference || '—'}</Table.Cell>
						<Table.Cell class="max-w-xs truncate">{entry.memo || '—'}</Table.Cell>
						<Table.Cell class="text-right">
							<Button href={`/accounting/journals/${entry.id}`} variant="outline" size="sm">
								View
							</Button>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={5} class="text-muted-foreground py-8 text-center">
							No opening balance entries yet.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
