<script lang="ts">
	import PayrollDeductionTypeIcon from '$lib/components/payroll/payroll-deduction-type-icon.svelte';
	import PayrollPayslipWorkspaceHeader from '$lib/components/payroll/payroll-payslip-workspace-header.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { PayrollCurrency } from '$lib/shared/payroll/currency';
	import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
	import type { PhDeductionIconKey } from '$lib/shared/payroll/deduction-icon-names';
	import { formatPayRateCents } from '$lib/shared/payroll/format';
	import { PAYROLL_PAY_TYPE_LABELS } from '$lib/shared/payroll/pay-rate';
	import { formatPayslipMoney, formatPayslipPeriod } from '$lib/shared/payroll/payslip-format';
	import {
		buildPayslipDisplayContext,
		buildPayslipEarningLines,
		buildPayslipEmployeeFields,
		buildPayslipTotalLines,
		formatPayslipDeductionLabel,
		formatPayslipEarningLineAmount,
		formatPayslipEarningLineLabel,
		isPayslipEarningInfoLine,
		PAYSLIP_CONFIDENTIALITY_NOTICE,
		PAYSLIP_DOCUMENT_TITLE,
		PAYSLIP_SECTION_LABELS
	} from '$lib/shared/payroll/payslip-sections';
	import { cn } from '$lib/utils.js';

	let {
		payslip,
		currency,
		workspaceName,
		registeredCompanyName = null,
		showYtdTotals = false,
		showEmployee = false,
		phDeductionIconUrls = {},
		class: className = '',
		variant = 'card'
	}: {
		payslip: PayrollPayslipDto;
		currency: PayrollCurrency;
		workspaceName: string;
		registeredCompanyName?: string | null;
		showYtdTotals?: boolean;
		showEmployee?: boolean;
		phDeductionIconUrls?: Partial<Record<PhDeductionIconKey, string>>;
		class?: string;
		variant?: 'card' | 'plain';
	} = $props();

	const showPhDeductionIcons = $derived(
		currency === 'PHP' && Object.keys(phDeductionIconUrls).length > 0
	);

	const display = $derived(
		buildPayslipDisplayContext({
			payslip,
			workspaceName,
			registeredCompanyName,
			showYtdTotals
		})
	);

	const employeeFields = $derived(buildPayslipEmployeeFields(payslip));
	const earningLines = $derived(buildPayslipEarningLines(payslip, currency));
	const totalLines = $derived(buildPayslipTotalLines(payslip, display.showYtdTotals));
</script>

{#if variant === 'card'}
	<Card.Root class={className}>
		<Card.Header class="border-b border-border">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div class="space-y-2">
					<Card.Title>{PAYSLIP_DOCUMENT_TITLE}</Card.Title>
					<Card.Description>{payslip.runTitle}</Card.Description>
					<p class="text-muted-foreground text-sm">{formatPayslipPeriod(payslip)}</p>
					<Badge variant="outline" class="w-fit capitalize">{payslip.payType}</Badge>
				</div>
				<PayrollPayslipWorkspaceHeader
					workspaceName={display.companyName}
					referenceNumber={display.referenceNumber}
				/>
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
				<h2 class="text-xl font-semibold tracking-tight">{PAYSLIP_DOCUMENT_TITLE}</h2>
				<p class="text-muted-foreground text-sm">{payslip.runTitle}</p>
				<p class="text-muted-foreground text-sm">{formatPayslipPeriod(payslip)}</p>
				<p class="text-muted-foreground text-sm capitalize">
					{payslip.payType} pay · {formatPayRateCents(payslip.payRateCents, payslip.payType, currency)}
					({PAYROLL_PAY_TYPE_LABELS[payslip.payType]})
				</p>
			</div>
			<PayrollPayslipWorkspaceHeader
				workspaceName={display.companyName}
				referenceNumber={display.referenceNumber}
			/>
		</div>
		{@render payslipBody()}
	</div>
{/if}

{#snippet payslipBody()}
	{#if showEmployee}
		<div class="space-y-3">
			<p class="text-sm font-medium">{PAYSLIP_SECTION_LABELS.employeeInformation}</p>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each employeeFields as field (field.label)}
					<div>
						<p class="text-muted-foreground text-sm">{field.label}</p>
						<p class="font-medium">{field.value}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="space-y-3">
		<p class="text-sm font-medium">{PAYSLIP_SECTION_LABELS.earnings}</p>
		<Table.Root>
			<Table.Body>
				{#each earningLines as line (line.key)}
					<Table.Row>
						<Table.Cell class={line.emphasize ? 'font-medium' : ''}>
							{formatPayslipEarningLineLabel(line)}
						</Table.Cell>
						<Table.Cell class={cn('text-right', line.emphasize ? 'font-semibold' : 'font-medium')}>
							{#if isPayslipEarningInfoLine(line)}
								{formatPayslipEarningLineAmount(line, currency)}
							{:else}
								{formatPayslipMoney(line.amountCents, currency)}
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	{#if payslip.deductionLines.length > 0}
		<div class="space-y-3">
			<p class="text-sm font-medium">{PAYSLIP_SECTION_LABELS.deductions}</p>
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
									<span>{formatPayslipDeductionLabel(line.name)}</span>
								</div>
							</Table.Cell>
							<Table.Cell class="text-right font-medium">
								−{formatPayslipMoney(line.amountCents, currency)}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}

	<div class="space-y-3">
		<p class="text-sm font-medium">{PAYSLIP_SECTION_LABELS.totals}</p>
		<Table.Root>
			<Table.Body>
				{#each totalLines as line (line.key)}
					<Table.Row>
						<Table.Cell class={line.emphasize ? 'font-medium' : ''}>{line.label}</Table.Cell>
						<Table.Cell
							class={cn(
								'text-right',
								line.emphasize ? 'text-lg font-semibold' : 'font-medium'
							)}
						>
							{#if line.key === 'total-deductions'}−{/if}
							{formatPayslipMoney(line.amountCents, currency)}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<div class="border-t border-border pt-4 text-center">
		<p class="text-muted-foreground text-xs">{PAYSLIP_CONFIDENTIALITY_NOTICE}</p>
		<p class="text-muted-foreground text-xs">Validation reference: {display.validationReference}</p>
	</div>
{/snippet}
