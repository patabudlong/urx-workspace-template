<script lang="ts">
	import { onMount } from 'svelte';
	import PayrollDeductionTypeIcon from '$lib/components/payroll/payroll-deduction-type-icon.svelte';
	import PayrollPayslipWorkspaceHeader from '$lib/components/payroll/payroll-payslip-workspace-header.svelte';
	import type { PayrollCurrency } from '$lib/shared/payroll/currency';
	import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
	import type { PhDeductionIconKey } from '$lib/shared/payroll/deduction-icon-names';
	import { PAYSLIP_PRINT_DOCUMENT_CSS } from '$lib/shared/payroll/payslip-print';
	import { formatPayRateCents } from '$lib/shared/payroll/format';
	import { PAYROLL_PAY_TYPE_LABELS } from '$lib/shared/payroll/pay-rate';
	import {
		formatPayslipGeneratedAt,
		formatPayslipMoney,
		formatPayslipPeriod,
		formatWorkedHours
	} from '$lib/shared/payroll/payslip-format';

	let {
		payslip,
		currency,
		workspaceName,
		brandLogoUrl = null,
		showEmployee = false,
		phDeductionIconUrls = {}
	}: {
		payslip: PayrollPayslipDto;
		currency: PayrollCurrency;
		workspaceName: string;
		brandLogoUrl?: string | null;
		showEmployee?: boolean;
		phDeductionIconUrls?: Partial<Record<PhDeductionIconKey, string>>;
	} = $props();

	const showPhDeductionIcons = $derived(
		currency === 'PHP' && Object.keys(phDeductionIconUrls).length > 0
	);

	const displayTotalDeductionsCents = $derived(
		payslip.deductionLines.reduce((sum, line) => sum + line.amountCents, 0)
	);

	const generatedAt = new Date();

	const PAYSLIP_PRINT_STYLE_ID = 'payslip-print-document-css';

	onMount(() => {
		if (document.getElementById(PAYSLIP_PRINT_STYLE_ID)) {
			return;
		}

		const style = document.createElement('style');
		style.id = PAYSLIP_PRINT_STYLE_ID;
		style.textContent = PAYSLIP_PRINT_DOCUMENT_CSS;
		document.head.appendChild(style);
	});
</script>

<article class="pd-root">
	<header class="pd-header">
		<div class="pd-header-main">
			<h1 class="pd-title">{payslip.runTitle}</h1>
			<p class="pd-subtitle">{formatPayslipPeriod(payslip)}</p>
			<p class="pd-subtitle capitalize">{payslip.payType} pay</p>
		</div>
		<PayrollPayslipWorkspaceHeader {workspaceName} {brandLogoUrl} />
	</header>

	{#if showEmployee}
		<section class="pd-employee">
			<div>
				<p class="pd-meta-label">Employee</p>
				<p class="pd-meta-value">{payslip.employeeFullName}</p>
				{#if payslip.employeeCode}
					<p class="pd-meta-hint">{payslip.employeeCode}</p>
				{/if}
			</div>
			{#if payslip.jobTitle}
				<div>
					<p class="pd-meta-label">Job title</p>
					<p class="pd-meta-value">{payslip.jobTitle}</p>
				</div>
			{/if}
		</section>
	{/if}

	<section class="pd-meta">
		<div>
			<p class="pd-meta-label">Pay rate</p>
			<p class="pd-meta-value">
				{formatPayRateCents(payslip.payRateCents, payslip.payType, currency)}
			</p>
			<p class="pd-meta-hint">{PAYROLL_PAY_TYPE_LABELS[payslip.payType]}</p>
		</div>
		<div>
			<p class="pd-meta-label">Actual Hours Logged</p>
			<p class="pd-meta-value">{formatWorkedHours(payslip.workedMinutes)}</p>
			<p class="pd-meta-hint">{payslip.workDays} day(s) with time</p>
		</div>
		<div>
			<p class="pd-meta-label">Net pay</p>
			<p class="pd-net">{formatPayslipMoney(payslip.netCents, currency)}</p>
		</div>
	</section>

	<section class="pd-section">
		<h3 class="pd-section-title">Earnings</h3>
		<table class="pd-table">
			<tbody>
				<tr>
					<td>Base pay</td>
					<td class="pd-strong">{formatPayslipMoney(payslip.basePayCents, currency)}</td>
				</tr>
				{#if payslip.holidayPayCents > 0}
					<tr>
						<td>Holiday pay</td>
						<td class="pd-strong">{formatPayslipMoney(payslip.holidayPayCents, currency)}</td>
					</tr>
				{/if}
				<tr>
					<td class="pd-total">Gross pay</td>
					<td class="pd-total">{formatPayslipMoney(payslip.grossCents, currency)}</td>
				</tr>
			</tbody>
		</table>
	</section>

	{#if payslip.deductionLines.length > 0}
		<section class="pd-section">
			<h3 class="pd-section-title">Deductions</h3>
			<table class="pd-table">
				<tbody>
					{#each payslip.deductionLines as line (line.typeId)}
						<tr>
							<td>
								{#if showPhDeductionIcons}
									<span class="pd-label">
										<PayrollDeductionTypeIcon
											name={line.name}
											iconUrls={phDeductionIconUrls}
											class="size-6 shrink-0 object-contain"
										/>
										<span>{line.name}</span>
									</span>
								{:else}
									{line.name}
								{/if}
							</td>
							<td class="pd-strong">−{formatPayslipMoney(line.amountCents, currency)}</td>
						</tr>
					{/each}
					<tr>
						<td class="pd-total">Total deductions</td>
						<td class="pd-total">−{formatPayslipMoney(displayTotalDeductionsCents, currency)}</td>
					</tr>
				</tbody>
			</table>
		</section>
	{/if}

	<footer class="pd-footer">
		<p>Date and time generated: {formatPayslipGeneratedAt(generatedAt)}</p>
	</footer>
</article>
