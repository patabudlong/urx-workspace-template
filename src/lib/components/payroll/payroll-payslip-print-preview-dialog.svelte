<script lang="ts">
	import PayrollPayslipPrintable from '$lib/components/payroll/payroll-payslip-printable.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { openPayslipPrintWindow } from '$lib/payroll/open-payslip-print-window';
	import type { PayrollCurrency } from '$lib/shared/payroll/currency';
	import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
	import type { PhDeductionIconKey } from '$lib/shared/payroll/deduction-icon-names';
	import PrinterIcon from '@lucide/svelte/icons/printer';

	let {
		open = $bindable(false),
		payslip,
		currency,
		workspaceName,
		brandLogoUrl = null,
		showEmployee = false,
		phDeductionIconUrls = {}
	}: {
		open?: boolean;
		payslip: PayrollPayslipDto;
		currency: PayrollCurrency;
		workspaceName: string;
		brandLogoUrl?: string | null;
		showEmployee?: boolean;
		phDeductionIconUrls?: Partial<Record<PhDeductionIconKey, string>>;
	} = $props();

	let printError = $state<string | null>(null);

	function printPayslip() {
		printError = null;

		const opened = openPayslipPrintWindow({
			payslip,
			currency,
			workspaceName,
			brandLogoUrl,
			showEmployee,
			phDeductionIconUrls
		});

		if (!opened) {
			printError = 'Could not open the print dialog. Try again.';
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Print preview</Dialog.Title>
			<Dialog.Description>
				Review the payslip layout before printing or saving as PDF.
			</Dialog.Description>
		</Dialog.Header>

		<div class="rounded-lg border border-border bg-background p-6">
			<PayrollPayslipPrintable
				{payslip}
				{currency}
				{workspaceName}
				{brandLogoUrl}
				{showEmployee}
				{phDeductionIconUrls}
			/>
		</div>

		{#if printError}
			<p class="text-destructive text-sm" role="alert">{printError}</p>
		{/if}

		<Dialog.Footer class="flex-row justify-end gap-2 sm:justify-end">
			<Button type="button" variant="outline" class="h-10" onclick={() => (open = false)}>
				Close
			</Button>
			<Button type="button" class="h-10" onclick={printPayslip}>
				<PrinterIcon class="size-4" aria-hidden="true" />
				Print
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
