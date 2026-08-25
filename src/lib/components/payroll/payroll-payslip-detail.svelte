<script lang="ts">
	import PayrollDeductionTypeIcon from '$lib/components/payroll/payroll-deduction-type-icon.svelte';
	import PayrollPayslipWorkspaceHeader from '$lib/components/payroll/payroll-payslip-workspace-header.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { PayrollCurrency } from '$lib/shared/payroll/currency';
	import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
	import type { PhDeductionIconKey } from '$lib/shared/payroll/deduction-icon-names';
	import {
		formatPayslipMoney,
		formatPayslipPeriod,
		formatWorkedHours
	} from '$lib/shared/payroll/payslip-format';
	import { PAYROLL_PAY_TYPE_LABELS } from '$lib/shared/payroll/pay-rate';
	import { formatPayRateCents } from '$lib/shared/payroll/format';
	import { cn } from '$lib/utils.js';

	let {
		payslip,
		currency,
		workspaceName,
		brandLogoUrl = null,
		showEmployee = false,
		phDeductionIconUrls = {},
		class: className = '',
		variant = 'card'
	}: {
		payslip: PayrollPayslipDto;
		currency: PayrollCurrency;
		workspaceName: string;
		brandLogoUrl?: string | null;
		showEmployee?: boolean;
		phDeductionIconUrls?: Partial<Record<PhDeductionIconKey, string>>;
		class?: string;
		variant?: 'card' | 'plain';
	} = $props();

	const showPhDeductionIcons = $derived(
		currency === 'PHP' && Object.keys(phDeductionIconUrls).length > 0
	);

	const displayTotalDeductionsCents = $derived(
		payslip.deductionLines.reduce((sum, line) => sum + line.amountCents, 0)
	);
</script>

{#if variant === 'card'}
	<Card.Root class={className}>
		<Card.Header class="border-b border-border">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div class="space-y-2">
					<Card.Title>{payslip.runTitle}</Card.Title>
					<Card.Description>{formatPayslipPeriod(payslip)}</Card.Description>
					<Badge variant="outline" class="w-fit capitalize">{payslip.payType}</Badge>
				</div>
				<PayrollPayslipWorkspaceHeader {workspaceName} {brandLogoUrl} />
			</div>
		</Card.Header>
		<Card.Content class="space-y-6">
			{@render payslipBody()}
		</Card.Content>
	</Card.Root>
{:else}
	<div class={cn('space-y-6', className)}>
		<div class="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="space-y-1">
				<h2 class="text-xl font-semibold tracking-tight">{payslip.runTitle}</h2>
				<p class="text-muted-foreground text-sm">{formatPayslipPeriod(payslip)}</p>
				<p class="text-muted-foreground text-sm capitalize">{payslip.payType} pay</p>
			</div>
			<PayrollPayslipWorkspaceHeader {workspaceName} {brandLogoUrl} />
		</div>
		{@render payslipBody()}
	</div>
{/if}

{#snippet payslipBody()}
	{#if showEmployee}
		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<p class="text-muted-foreground text-sm">Employee</p>
				<p class="font-medium">{payslip.employeeFullName}</p>
				{#if payslip.employeeCode}
					<p class="text-muted-foreground text-sm">{payslip.employeeCode}</p>
				{/if}
			</div>
			{#if payslip.jobTitle}
				<div>
					<p class="text-muted-foreground text-sm">Job title</p>
					<p class="font-medium">{payslip.jobTitle}</p>
				</div>
			{/if}
		</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-3">
		<div>
			<p class="text-muted-foreground text-sm">Pay rate</p>
			<p class="font-medium">
				{formatPayRateCents(payslip.payRateCents, payslip.payType, currency)}
			</p>
			<p class="text-muted-foreground text-xs">{PAYROLL_PAY_TYPE_LABELS[payslip.payType]}</p>
		</div>
		<div>
			<p class="text-muted-foreground text-sm">Time worked</p>
			<p class="font-medium">{formatWorkedHours(payslip.workedMinutes)}</p>
			<p class="text-muted-foreground text-xs">{payslip.workDays} day(s) with time</p>
		</div>
		<div>
			<p class="text-muted-foreground text-sm">Net pay</p>
			<p class="text-lg font-semibold">{formatPayslipMoney(payslip.netCents, currency)}</p>
		</div>
	</div>

	<div class="space-y-3">
		<p class="text-sm font-medium">Earnings</p>
		<Table.Root>
			<Table.Body>
				<Table.Row>
					<Table.Cell>Base pay</Table.Cell>
					<Table.Cell class="text-right font-medium">
						{formatPayslipMoney(payslip.basePayCents, currency)}
					</Table.Cell>
				</Table.Row>
				{#if payslip.holidayPayCents > 0}
					<Table.Row>
						<Table.Cell>Holiday pay</Table.Cell>
						<Table.Cell class="text-right font-medium">
							{formatPayslipMoney(payslip.holidayPayCents, currency)}
						</Table.Cell>
					</Table.Row>
				{/if}
				<Table.Row>
					<Table.Cell class="font-medium">Gross pay</Table.Cell>
					<Table.Cell class="text-right font-semibold">
						{formatPayslipMoney(payslip.grossCents, currency)}
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</div>

	{#if payslip.deductionLines.length > 0}
		<div class="space-y-3">
			<p class="text-sm font-medium">Deductions</p>
			<Table.Root>
				<Table.Body>
					{#each payslip.deductionLines as line (line.typeId)}
						<Table.Row>
							<Table.Cell>
								<div class="flex items-center gap-2.5">
									{#if showPhDeductionIcons}
										<PayrollDeductionTypeIcon
											name={line.name}
											iconUrls={phDeductionIconUrls}
											class="size-7 shrink-0 rounded-md object-contain bg-muted/40 p-0.5"
										/>
									{/if}
									<span>{line.name}</span>
								</div>
							</Table.Cell>
							<Table.Cell class="text-right font-medium">
								−{formatPayslipMoney(line.amountCents, currency)}
							</Table.Cell>
						</Table.Row>
					{/each}
					<Table.Row>
						<Table.Cell class="font-medium">Total deductions</Table.Cell>
						<Table.Cell class="text-right font-semibold">
							−{formatPayslipMoney(displayTotalDeductionsCents, currency)}
						</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
{/snippet}
