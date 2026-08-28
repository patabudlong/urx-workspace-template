<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		ACCOUNTING_PERIOD_CLOSED_MESSAGE,
		ACCOUNTING_PERIOD_CLOSE_EMPTY_MESSAGE,
		ACCOUNTING_PERIOD_CLOSE_MISSING_OPENING_BALANCE_MESSAGE,
		ACCOUNTING_PERIOD_LOCKED_MESSAGE,
		ACCOUNTING_PERIOD_REOPENED_MESSAGE
	} from '$lib/shared/accounting/messages';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let closingPeriodId = $state<string | null>(null);
	let lockingPeriodId = $state<string | null>(null);
	let reopeningPeriodId = $state<string | null>(null);

	const showSuccess = $derived(
		form?.message === ACCOUNTING_PERIOD_CLOSED_MESSAGE ||
			form?.message === ACCOUNTING_PERIOD_LOCKED_MESSAGE ||
			form?.message === ACCOUNTING_PERIOD_REOPENED_MESSAGE
	);

	function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
		if (status === 'open') {
			return 'default';
		}

		if (status === 'closed') {
			return 'secondary';
		}

		return 'outline';
	}

	function canClosePeriod(period: (typeof data.periods)[number]): boolean {
		if (period.journalEntryCount === 0) {
			return false;
		}

		if (period.requiresOpeningBalance && !period.hasOpeningBalance) {
			return false;
		}

		return true;
	}

	function closeDisabledReason(period: (typeof data.periods)[number]): string {
		if (period.journalEntryCount === 0) {
			return ACCOUNTING_PERIOD_CLOSE_EMPTY_MESSAGE;
		}

		if (period.requiresOpeningBalance && !period.hasOpeningBalance) {
			return ACCOUNTING_PERIOD_CLOSE_MISSING_OPENING_BALANCE_MESSAGE;
		}

		return '';
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Accounting"
		title="Fiscal periods"
		description="Close a period when posting is complete, reopen closed periods if corrections are needed, then lock to prevent further changes."
	/>

	{#if showSuccess}
		<StatusAlert variant="success" title="Period updated" description={form?.message ?? ''} />
	{:else if typeof form?.message === 'string' && form.message.length > 0}
		<StatusAlert variant="danger" title="Could not update period" description={form.message} />
	{/if}

	<div class="rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Period</Table.Head>
					<Table.Head>Start</Table.Head>
					<Table.Head>End</Table.Head>
					<Table.Head>Journals</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.periods as period (period.id)}
					<Table.Row>
						<Table.Cell class="font-medium">{period.label}</Table.Cell>
						<Table.Cell>{period.startDate}</Table.Cell>
						<Table.Cell>{period.endDate}</Table.Cell>
						<Table.Cell>{period.journalEntryCount}</Table.Cell>
						<Table.Cell>
							<Badge variant={statusVariant(period.status)} class="capitalize">
								{period.status}
							</Badge>
						</Table.Cell>
						<Table.Cell class="text-right">
							<div class="flex justify-end gap-2">
								{#if period.status === 'open'}
									<form
										method="POST"
										action="?/close"
										use:enhance={() => {
											closingPeriodId = period.id;
											return async ({ update }) => {
												await update();
												closingPeriodId = null;
											};
										}}
									>
										<input type="hidden" name="periodId" value={period.id} />
										<Button
											type="submit"
											variant="outline"
											size="sm"
											disabled={closingPeriodId === period.id || !canClosePeriod(period)}
											title={closeDisabledReason(period) || undefined}
										>
											{#if closingPeriodId === period.id}
												<Loader2Icon class="size-4 animate-spin" />
											{/if}
											Close
										</Button>
									</form>
								{:else if period.status === 'closed'}
									<form
										method="POST"
										action="?/reopen"
										use:enhance={() => {
											reopeningPeriodId = period.id;
											return async ({ update }) => {
												await update();
												reopeningPeriodId = null;
											};
										}}
									>
										<input type="hidden" name="periodId" value={period.id} />
										<Button
											type="submit"
											variant="ghost"
											size="sm"
											disabled={reopeningPeriodId === period.id}
										>
											{#if reopeningPeriodId === period.id}
												<Loader2Icon class="size-4 animate-spin" />
											{/if}
											Reopen
										</Button>
									</form>
									<form
										method="POST"
										action="?/lock"
										use:enhance={() => {
											lockingPeriodId = period.id;
											return async ({ update }) => {
												await update();
												lockingPeriodId = null;
											};
										}}
									>
										<input type="hidden" name="periodId" value={period.id} />
										<Button
											type="submit"
											variant="outline"
											size="sm"
											disabled={lockingPeriodId === period.id}
										>
											{#if lockingPeriodId === period.id}
												<Loader2Icon class="size-4 animate-spin" />
											{/if}
											Lock
										</Button>
									</form>
								{:else}
									<span class="text-muted-foreground text-sm">Locked</span>
								{/if}
							</div>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={6} class="text-muted-foreground py-8 text-center">
							No fiscal periods yet. Complete company setup first.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
