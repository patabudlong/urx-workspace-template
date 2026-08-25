<script lang="ts">
	import PayrollDeleteRunDialog from '$lib/components/payroll/payroll-delete-run-dialog.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
	import type { PayrollRunDto } from '$lib/shared/models/payroll-run';
	import type { PayrollRunStatus } from '$lib/shared/payroll/schemas';
	import {
		PAYROLL_RUN_ALREADY_PROCESSED_MESSAGE,
		PAYROLL_RUN_DELETE_FAILED_MESSAGE,
		PAYROLL_RUN_DELETE_PROCESSING_MESSAGE,
		PAYROLL_RUN_PROCESS_FAILED_MESSAGE,
		PAYROLL_RUN_PROCESSED_MESSAGE
	} from '$lib/shared/payroll/messages';
	import { formatPayslipMoney } from '$lib/shared/payroll/payslip-format';
	import { cn } from '$lib/utils.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import PlayIcon from '@lucide/svelte/icons/play';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { goto, invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	let { data } = $props();

	let payslips = $state<PayrollPayslipDto[] | null>(null);
	let processing = $state(false);
	let deleting = $state(false);
	let showProcessSuccess = $state(false);
	let deleteDialogOpen = $state(false);
	let deleteError = $state<string | null>(null);

	const processForm = superForm(untrack(() => data.form), {
		validators: zod4Client(z.object({})),
		onSubmit: () => {
			processing = true;
			showProcessSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			processing = false;

			if (updatedForm.message === PAYROLL_RUN_PROCESSED_MESSAGE) {
				showProcessSuccess = true;
				await invalidateAll();
			}
		},
		onError: () => {
			processing = false;
		}
	});

	const { enhance: processEnhance, message: processMessage } = processForm;

	$effect(() => {
		const next = data.payslips as Promise<PayrollPayslipDto[]> | PayrollPayslipDto[];

		if (Array.isArray(next)) {
			payslips = next;
			return;
		}

		if (!next || typeof next.then !== 'function') {
			payslips = [];
			return;
		}

		payslips = null;

		void next.then((resolved) => {
			payslips = resolved;
		});
	});

	const run = $derived(data.run as PayrollRunDto);
	const currency = $derived(data.currency);

	const processError = $derived(
		typeof $processMessage === 'string' &&
			$processMessage.length > 0 &&
			$processMessage !== PAYROLL_RUN_PROCESSED_MESSAGE
	);

	const totals = $derived.by(() => {
		if (!payslips || payslips.length === 0) {
			return null;
		}

		return payslips.reduce(
			(acc, payslip) => ({
				grossCents: acc.grossCents + payslip.grossCents,
				netCents: acc.netCents + payslip.netCents
			}),
			{ grossCents: 0, netCents: 0 }
		);
	});

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(new Date(value));
	}

	function statusVariant(
		status: PayrollRunStatus
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (status === 'completed') {
			return 'default';
		}

		if (status === 'failed') {
			return 'destructive';
		}

		if (status === 'draft') {
			return 'outline';
		}

		return 'secondary';
	}

	function statusLabel(status: PayrollRunStatus): string {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	const canProcess = $derived(run.status === 'draft' || run.status === 'failed');
	const canDelete = $derived(run.status !== 'processing');

	const deleteEnhance: import('@sveltejs/kit').SubmitFunction = () => {
		deleting = true;
		deleteError = null;

		return async ({ result }) => {
			deleting = false;

			if (result.type === 'redirect') {
				deleteDialogOpen = false;
				await goto(result.location);
				return;
			}

			if (result.type === 'failure') {
				const message = typeof result.data?.message === 'string' ? result.data.message : null;
				deleteError =
					message === PAYROLL_RUN_DELETE_PROCESSING_MESSAGE ||
					message === PAYROLL_RUN_DELETE_FAILED_MESSAGE
						? message
						: PAYROLL_RUN_DELETE_FAILED_MESSAGE;
			}
		};
	};
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title={run.title}
		description="{formatDate(run.periodStart)} – {formatDate(run.periodEnd)}"
	>
		{#snippet actions()}
			<div class="flex flex-wrap gap-2">
				<Button variant="outline" href="/payroll/runs" class="h-10">
					<ArrowLeftIcon class="size-4" aria-hidden="true" />
					Back to pay runs
				</Button>
				{#if canDelete}
					<PayrollDeleteRunDialog
						bind:open={deleteDialogOpen}
						runTitle={run.title}
						isCompleted={run.status === 'completed'}
						submitting={deleting}
						enhanceAction={deleteEnhance}
					/>
				{/if}
			</div>
		{/snippet}
	</PageHeader>

	<div class="flex flex-wrap items-center gap-3">
		<Badge
			variant={statusVariant(run.status)}
			class={cn('capitalize', run.status === 'processing' && 'animate-pulse')}
		>
			{#if run.status === 'completed'}
				<CircleCheckIcon aria-hidden="true" />
			{:else if run.status === 'failed'}
				<CircleXIcon aria-hidden="true" />
			{:else if run.status === 'processing'}
				<Loader2Icon class="animate-spin" aria-hidden="true" />
			{:else}
				<CircleDashedIcon aria-hidden="true" />
			{/if}
			{statusLabel(run.status)}
		</Badge>
		{#if payslips}
			<span class="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
				<UsersIcon class="size-3.5" aria-hidden="true" />
				{payslips.length} payslip{payslips.length === 1 ? '' : 's'}
			</span>
		{/if}
	</div>

	{#if deleteError}
		<StatusAlert variant="danger" title="Could not remove pay run" description={deleteError} />
	{/if}

	{#if totals}
		<div class="grid gap-4 sm:grid-cols-2">
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>Total gross</Card.Description>
					<Card.Title class="text-2xl font-semibold tracking-tight">
						{formatPayslipMoney(totals.grossCents, currency)}
					</Card.Title>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>Total net pay</Card.Description>
					<Card.Title class="text-2xl font-semibold tracking-tight">
						{formatPayslipMoney(totals.netCents, currency)}
					</Card.Title>
				</Card.Header>
			</Card.Root>
		</div>
	{/if}

	{#if canProcess}
		<Card.Root class="border-primary/20 bg-primary/[0.02]">
			<Card.Header>
				<Card.Title>Process pay run</Card.Title>
				<Card.Description>
					Calculate payslips from active employees and DTR time records for this period.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#if showProcessSuccess}
					<StatusAlert
						variant="success"
						title="Pay run processed"
						description="Payslips were generated from DTR and employee settings."
					/>
				{:else if processError}
					<StatusAlert
						variant="danger"
						title="Could not process pay run"
						description={$processMessage === PAYROLL_RUN_PROCESS_FAILED_MESSAGE ||
						$processMessage === PAYROLL_RUN_ALREADY_PROCESSED_MESSAGE
							? $processMessage
							: String($processMessage)}
					/>
				{/if}

				<form method="POST" action="?/process" use:processEnhance>
					<Button type="submit" class="h-10" disabled={processing}>
						{#if processing}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Processing...
						{:else}
							<PlayIcon class="size-4" aria-hidden="true" />
							Process pay run
						{/if}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Payslips</Card.Title>
			<Card.Description>
				{#if payslips && payslips.length > 0}
					Per-employee earnings for this pay period.
				{:else}
					Per-employee earnings after this pay run is processed.
				{/if}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if payslips === null}
				<div class="space-y-3" aria-busy="true" aria-label="Loading payslips">
					{#each Array.from({ length: 4 }) as _, index (index)}
						<Skeleton class="h-12 w-full" />
					{/each}
				</div>
			{:else if payslips.length === 0}
				<div class="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 py-12 text-center">
					<div
						class="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full"
					>
						<PlayIcon class="size-5" aria-hidden="true" />
					</div>
					<div class="max-w-sm space-y-1">
						<p class="font-medium">No payslips yet</p>
						<p class="text-muted-foreground text-sm">
							Process this pay run to generate payslips from DTR time records and employee pay
							settings.
						</p>
					</div>
				</div>
			{:else}
				<div class="overflow-x-auto rounded-lg border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="min-w-44">Employee</Table.Head>
								<Table.Head class="min-w-28 text-right">Gross</Table.Head>
								<Table.Head class="min-w-28 text-right">Net</Table.Head>
								<Table.Head class="w-12" />
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each payslips as payslip (payslip.id)}
								<Table.Row
									class="group cursor-pointer"
									onclick={() => goto(`/payroll/payslips/${payslip.id}`)}
								>
									<Table.Cell class="h-px align-middle">
										<div class="flex h-full min-w-0 items-center">
											<div class="min-w-0 space-y-0.5">
												<p
													class="group-hover:text-primary truncate font-medium transition-colors"
												>
													{payslip.employeeFullName}
												</p>
												{#if payslip.employeeCode}
													<p class="text-muted-foreground truncate text-xs">
														{payslip.employeeCode}
													</p>
												{/if}
											</div>
										</div>
									</Table.Cell>
									<Table.Cell class="h-px align-middle text-right whitespace-nowrap">
										<div class="flex h-full items-center justify-end text-sm">
											{formatPayslipMoney(payslip.grossCents, currency)}
										</div>
									</Table.Cell>
									<Table.Cell class="h-px align-middle text-right font-medium whitespace-nowrap">
										<div class="flex h-full items-center justify-end">
											{formatPayslipMoney(payslip.netCents, currency)}
										</div>
									</Table.Cell>
									<Table.Cell class="h-px align-middle text-right">
										<div class="flex h-full items-center justify-end">
											<Button
												variant="ghost"
												size="icon-sm"
												class="text-muted-foreground group-hover:text-foreground h-8 w-8"
												href="/payroll/payslips/{payslip.id}"
												aria-label="View payslip for {payslip.employeeFullName}"
												onclick={(event) => event.stopPropagation()}
											>
												<ChevronRightIcon class="size-4" aria-hidden="true" />
											</Button>
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
