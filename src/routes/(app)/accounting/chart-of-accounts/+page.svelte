<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { AccountType } from '$lib/shared/accounting/core/account-types';

	let { data } = $props();
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Accounting"
		title="Chart of accounts"
		description="PH SME template accounts seeded on first setup. Account editing arrives in a later phase."
	/>

	<div class="rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Code</Table.Head>
					<Table.Head>Name</Table.Head>
					<Table.Head>Type</Table.Head>
					<Table.Head>Status</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.accounts as account (account.id)}
					<Table.Row>
						<Table.Cell class="font-mono">{account.code}</Table.Cell>
						<Table.Cell>{account.name}</Table.Cell>
						<Table.Cell>{data.accountTypeLabels[account.type as AccountType]}</Table.Cell>
						<Table.Cell>
							<Badge variant={account.isActive ? 'secondary' : 'outline'}>
								{account.isActive ? 'Active' : 'Inactive'}
							</Badge>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={4} class="text-muted-foreground py-8 text-center">
							No accounts yet. Complete company setup to seed the chart of accounts.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
