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
		formatPayslipPeriod
	} from '$lib/shared/payroll/payslip-format';
	import {
		buildPayslipDeductionLines,
		buildPayslipDisplayContext,
		buildPayslipEarningLines,
		buildPayslipEmployeeFields,
		buildPayslipTotalLines,
		formatPayslipEarningLineAmount,
		formatPayslipEarningLineLabel,
		isPayslipEarningInfoLine,
		PAYSLIP_CONFIDENTIALITY_NOTICE,
		PAYSLIP_DOCUMENT_TITLE,
		PAYSLIP_SECTION_LABELS
	} from '$lib/shared/payroll/payslip-sections';

	let {
		payslip,
		currency,
		workspaceName,
		registeredCompanyName = null,
		showYtdTotals = false,
		showEmployee = false,
		phDeductionIconUrls = {}
	}: {
		payslip: PayrollPayslipDto;
		currency: PayrollCurrency;
		workspaceName: string;
		registeredCompanyName?: string | null;
		showYtdTotals?: boolean;
		showEmployee?: boolean;
		phDeductionIconUrls?: Partial<Record<PhDeductionIconKey, string>>;
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
	const deductionLines = $derived(buildPayslipDeductionLines(payslip.deductionLines));
	const totalLines = $derived(buildPayslipTotalLines(payslip, display.showYtdTotals));

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
			<h1 class="pd-title">{PAYSLIP_DOCUMENT_TITLE}</h1>
			<p class="pd-subtitle">{payslip.runTitle}</p>
			<p class="pd-subtitle capitalize">
				{payslip.payType} pay · {formatPayRateCents(payslip.payRateCents, payslip.payType, currency)}
				({PAYROLL_PAY_TYPE_LABELS[payslip.payType]})
			</p>
		</div>
		<PayrollPayslipWorkspaceHeader
			workspaceName={display.companyName}
			referenceNumber={display.referenceNumber}
			periodLabel={formatPayslipPeriod(payslip)}
		/>
	</header>

	{#if showEmployee}
		<section class="pd-section">
			<h3 class="pd-section-title">{PAYSLIP_SECTION_LABELS.employeeInformation}</h3>
			<div class="pd-employee">
				{#each employeeFields as field (field.label)}
					<div>
						<p class="pd-meta-label">{field.label}</p>
						<p class="pd-meta-value">{field.value}</p>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<section class="pd-section">
		<h3 class="pd-section-title">{PAYSLIP_SECTION_LABELS.earnings}</h3>
		<table class="pd-table">
			<tbody>
				{#each earningLines as line (line.key)}
					<tr>
						<td class={line.emphasize ? 'pd-total' : ''}>{formatPayslipEarningLineLabel(line)}</td>
						<td class={line.emphasize ? 'pd-total' : 'pd-strong'}>
							{#if isPayslipEarningInfoLine(line)}
								{formatPayslipEarningLineAmount(line, currency)}
							{:else}
								{formatPayslipMoney(line.amountCents, currency)}
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	{#if deductionLines.length > 0}
		<section class="pd-section">
			<h3 class="pd-section-title">{PAYSLIP_SECTION_LABELS.deductions}</h3>
			<table class="pd-table">
				<tbody>
					{#each deductionLines as line (line.key)}
						<tr>
							<td>
								{#if showPhDeductionIcons}
									<span class="pd-label">
										<PayrollDeductionTypeIcon
											name={line.label}
											iconUrls={phDeductionIconUrls}
											class="size-6 shrink-0 object-contain"
										/>
										<span>{line.label}</span>
									</span>
								{:else}
									{line.label}
								{/if}
							</td>
							<td class="pd-strong">−{formatPayslipMoney(line.amountCents, currency)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}

	<section class="pd-section">
		<h3 class="pd-section-title">{PAYSLIP_SECTION_LABELS.totals}</h3>
		<table class="pd-table">
			<tbody>
				{#each totalLines as line (line.key)}
					<tr>
						<td class={line.emphasize ? 'pd-total' : ''}>{line.label}</td>
						<td class={line.emphasize ? 'pd-total' : 'pd-strong'}>
							{#if line.key === 'total-deductions'}−{/if}
							{formatPayslipMoney(line.amountCents, currency)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<footer class="pd-footer">
		<p>{PAYSLIP_CONFIDENTIALITY_NOTICE}</p>
		<p>Validation reference: {display.validationReference}</p>
		<p>Date and time generated: {formatPayslipGeneratedAt(generatedAt)}</p>
	</footer>
</article>
