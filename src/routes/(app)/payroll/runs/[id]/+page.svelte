<script lang="ts">
	import PayrollDeleteRunDialog from '$lib/components/payroll/payroll-delete-run-dialog.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import PayrollPayslipDetail from '$lib/components/payroll/payroll-payslip-detail.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
	import type { PayrollRunDto } from '$lib/shared/models/payroll-run';
	import {
		PAYROLL_RUN_ALREADY_PROCESSED_MESSAGE,
		PAYROLL_RUN_DELETE_FAILED_MESSAGE,
		PAYROLL_RUN_DELETE_PROCESSING_MESSAGE,
		PAYROLL_RUN_PROCESS_FAILED_MESSAGE,
		PAYROLL_RUN_PROCESSED_MESSAGE
	} from '$lib/shared/payroll/messages';
	import { formatPayslipMoney } from '$lib/shared/payroll/payslip-format';
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import PlayIcon from '@lucide/svelte/icons/play';
	import { invalidateAll } from '$app/navigation';
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

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(new Date(value));
	}

	function statusVariant(status: PayrollRunDto['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (status === 'completed') {
			return 'default';
		}

		if (status === 'failed') {
			return 'destructive';
		}

		return 'secondary';
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
		<Badge variant={statusVariant(run.status)} class="capitalize">{run.status}</Badge>
		{#if payslips}
			<span class="text-muted-foreground text-sm">{payslips.length} payslip(s)</span>
		{/if}
	</div>

	{#if deleteError}
		<StatusAlert variant="danger" title="Could not remove pay run" description={deleteError} />
	{/if}

	{#if canProcess}
		<Card.Root>
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
			<Card.Description>Per-employee earnings after this pay run is processed.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if payslips === null}
				<div class="space-y-3" aria-busy="true" aria-label="Loading payslips">
					{#each Array.from({ length: 4 }) as _, index (index)}
						<Skeleton class="h-12 w-full" />
					{/each}
				</div>
			{:else if payslips.length === 0}
				<StatusAlert
					variant="info"
					title="No payslips yet"
					description="Process this pay run to generate payslips from DTR time records and employee pay settings."
				/>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Employee</Table.Head>
							<Table.Head class="text-right">Gross</Table.Head>
							<Table.Head class="text-right">Net</Table.Head>
							<Table.Head class="w-[100px]" />
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each payslips as payslip (payslip.id)}
							<Table.Row>
								<Table.Cell>
									<div class="min-w-0">
										<p class="truncate font-medium">{payslip.employeeFullName}</p>
										{#if payslip.employeeCode}
											<p class="text-muted-foreground text-sm">{payslip.employeeCode}</p>
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									{formatPayslipMoney(payslip.grossCents, currency)}
								</Table.Cell>
								<Table.Cell class="text-right font-medium">
									{formatPayslipMoney(payslip.netCents, currency)}
								</Table.Cell>
								<Table.Cell class="text-right">
									<Button variant="outline" size="sm" href="/payroll/payslips/{payslip.id}">
										View
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
