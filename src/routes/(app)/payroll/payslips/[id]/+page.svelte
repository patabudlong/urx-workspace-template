<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import PayrollPayslipDetail from '$lib/components/payroll/payroll-payslip-detail.svelte';
	import PayrollPayslipPrintPreviewDialog from '$lib/components/payroll/payroll-payslip-print-preview-dialog.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		PAYROLL_PAYSLIP_EMAIL_FAILED_MESSAGE,
		PAYROLL_PAYSLIP_EMAIL_NOT_CONFIGURED_MESSAGE,
		PAYROLL_PAYSLIP_EMAIL_SENT_MESSAGE
	} from '$lib/shared/payroll/messages';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PrinterIcon from '@lucide/svelte/icons/printer';

	let { data } = $props();

	let emailing = $state(false);
	let emailSuccess = $state(false);
	let emailError = $state<string | null>(null);
	let printPreviewOpen = $state(false);

	async function emailPayslip() {
		emailing = true;
		emailSuccess = false;
		emailError = null;

		try {
			const response = await fetch(`/api/v1/payroll/payslips/${data.payslip.id}/email`, {
				method: 'POST',
				headers: {
					Accept: 'application/json'
				}
			});

			const body = await response.json().catch(() => null);

			if (!response.ok) {
				emailError =
					body?.error?.message ??
					(response.status === 503
						? PAYROLL_PAYSLIP_EMAIL_NOT_CONFIGURED_MESSAGE
						: PAYROLL_PAYSLIP_EMAIL_FAILED_MESSAGE);
				return;
			}

			emailSuccess = true;
		} catch {
			emailError = PAYROLL_PAYSLIP_EMAIL_FAILED_MESSAGE;
		} finally {
			emailing = false;
		}
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader eyebrow="Payroll" title="Payslip" description={data.payslip.runTitle}>
		{#snippet actions()}
			<div class="flex flex-wrap gap-2">
				<Button variant="outline" href="/payroll/payslips" class="h-10">
					<ArrowLeftIcon class="size-4" aria-hidden="true" />
					Back to payslips
				</Button>
				<Button
					type="button"
					variant="outline"
					class="h-10"
					onclick={() => (printPreviewOpen = true)}
				>
					<PrinterIcon class="size-4" aria-hidden="true" />
					Print preview
				</Button>
				<Button type="button" variant="outline" class="h-10" disabled={emailing} onclick={emailPayslip}>
					{#if emailing}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Sending email...
					{:else}
						<MailIcon class="size-4" aria-hidden="true" />
						Email payslip
					{/if}
				</Button>
			</div>
		{/snippet}
	</PageHeader>

	{#if emailSuccess}
		<StatusAlert
			variant="success"
			title="Payslip emailed"
			description={PAYROLL_PAYSLIP_EMAIL_SENT_MESSAGE}
		/>
	{:else if emailError}
		<StatusAlert variant="danger" title="Could not email payslip" description={emailError} />
	{/if}

	<PayrollPayslipDetail
		payslip={data.payslip}
		currency={data.currency}
		workspaceName={data.workspaceName}
		registeredCompanyName={data.registeredCompanyName}
		showYtdTotals={data.showYtdTotals}
		showEmployee={data.canManagePayroll}
		phDeductionIconUrls={data.phDeductionIconUrls}
	/>
</div>

<PayrollPayslipPrintPreviewDialog
	bind:open={printPreviewOpen}
	payslip={data.payslip}
	currency={data.currency}
	workspaceName={data.workspaceName}
	registeredCompanyName={data.registeredCompanyName}
	showYtdTotals={data.showYtdTotals}
	showEmployee={data.canManagePayroll}
	phDeductionIconUrls={data.phDeductionIconUrls}
/>
