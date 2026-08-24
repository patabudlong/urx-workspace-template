<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { PayrollPayslipDto } from '$lib/shared/models/payroll-payslip';
	import { PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE } from '$lib/shared/payroll/messages';
	import { formatPayslipMoney, formatPayslipPeriod } from '$lib/shared/payroll/payslip-format';
	import { page } from '$app/state';

	let { data } = $props();

	let payslips = $state<PayrollPayslipDto[] | null>(null);

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

	const isAdmin = $derived(page.data.canManagePayroll);
	const title = $derived(isAdmin ? 'Payslips' : 'My payslips');
	const description = $derived(
		isAdmin
			? 'Your payslips when your login email matches an employee record. Open a pay run to review all payslips.'
			: 'Payslips from completed pay runs for your employee record.'
	);
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader eyebrow="Payroll" title={title} description={description} />

	{#if data.needsEmployeeLink}
		<StatusAlert
			variant="warning"
			title="Employee record not linked"
			description={PAYROLL_EMPLOYEE_LINK_REQUIRED_MESSAGE}
		/>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title>{title}</Card.Title>
				<Card.Description>Completed pay runs appear here after processing.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if payslips === null}
					<div class="space-y-3" aria-busy="true" aria-label="Loading payslips">
						{#each Array.from({ length: 4 }) as _, index (index)}
							<Skeleton class="h-14 w-full" />
						{/each}
					</div>
				{:else if payslips.length === 0}
					<StatusAlert
						variant="info"
						title="No payslips yet"
						description="Payslips appear after an admin processes a pay run that includes your time records."
					/>
				{:else}
					<ul class="divide-border divide-y">
						{#each payslips as payslip (payslip.id)}
							<li class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
								<div class="min-w-0 space-y-1">
									<p class="truncate font-medium">{payslip.runTitle}</p>
									<p class="text-muted-foreground text-sm">{formatPayslipPeriod(payslip)}</p>
								</div>
								<div class="flex flex-wrap items-center gap-3">
									<Badge variant="outline" class="font-normal">
										Net {formatPayslipMoney(payslip.netCents, data.currency)}
									</Badge>
									<Button variant="outline" size="sm" href="/payroll/payslips/{payslip.id}">
										View payslip
									</Button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
