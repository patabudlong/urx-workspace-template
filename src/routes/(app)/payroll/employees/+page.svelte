<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import PayrollEmployeeAvatar from '$lib/components/payroll/payroll-employee-avatar.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { PAYROLL_EMPLOYEE_DEACTIVATED_MESSAGE } from '$lib/shared/payroll/messages';
	import { filterPayrollEmployees } from '$lib/shared/payroll/filter-employees';
	import { formatPayRateCents } from '$lib/shared/payroll/format';
	import { PAYROLL_PAY_TYPE_LABELS } from '$lib/shared/payroll/pay-rate';
	import type { PayrollEmployeeDto } from '$lib/shared/models/payroll-employee';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { page } from '$app/state';

	let { data } = $props();

	const showDeactivatedAlert = $derived(page.url.searchParams.get('deactivated') === '1');

	let searchQuery = $state('');
	let employees = $state<PayrollEmployeeDto[] | null>(null);

	$effect(() => {
		const next = data.employees as Promise<PayrollEmployeeDto[]> | PayrollEmployeeDto[];

		if (Array.isArray(next)) {
			employees = next;
			return;
		}

		if (!next || typeof next.then !== 'function') {
			employees = [];
			return;
		}

		employees = null;

		void next.then((resolved) => {
			employees = resolved;
		});
	});

	const filteredEmployees = $derived(
		employees === null ? [] : filterPayrollEmployees(employees, searchQuery)
	);
	const isSearching = $derived(searchQuery.trim().length > 0);

	function formatCell(value: string | null | undefined): string {
		return value?.trim() || '—';
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Employees"
		description="People paid through this workspace. Add employees before creating pay runs."
	>
		{#snippet actions()}
			<Button href="/payroll/employees/new" class="h-10">
				<UserPlusIcon class="size-4" aria-hidden="true" />
				Add employee
			</Button>
		{/snippet}
	</PageHeader>

	{#if showDeactivatedAlert}
		<StatusAlert
			variant="success"
			title="Employee deactivated"
			description={PAYROLL_EMPLOYEE_DEACTIVATED_MESSAGE}
		/>
	{/if}

	<Card.Root>
		{#if employees === null}
			<Card.Header>
				<Skeleton class="h-6 w-40" />
				<Skeleton class="mt-2 h-4 w-64" />
			</Card.Header>
			<Card.Content class="space-y-3">
				{#each Array.from({ length: 5 }) as _, index (index)}
					<Skeleton class="h-14 w-full" />
				{/each}
			</Card.Content>
		{:else}
			<Card.Header>
				<Card.Title>Active employees</Card.Title>
				<Card.Description>
					{employees.length === 1
						? '1 employee on payroll.'
						: `${employees.length} employees on payroll.`}
				</Card.Description>
				{#if employees.length > 0}
					<Card.Action>
						<ListSearchInput
							bind:value={searchQuery}
							placeholder="Search employees..."
							ariaLabel="Search employees"
						/>
					</Card.Action>
				{/if}
			</Card.Header>
			<Card.Content>
				{#if employees.length === 0}
					<StatusAlert
						variant="info"
						title="No employees yet"
						description="Add your first employee to start building payroll runs."
					/>
					<Button href="/payroll/employees/new" class="mt-4 h-10">
						<UserPlusIcon class="size-4" aria-hidden="true" />
						Add employee
					</Button>
				{:else if filteredEmployees.length === 0}
					<p class="text-muted-foreground text-sm">No employees match your search.</p>
				{:else}
					<div class="overflow-x-auto rounded-lg border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="min-w-40">Name</Table.Head>
									<Table.Head class="min-w-28">Code</Table.Head>
									<Table.Head class="min-w-36">Job title</Table.Head>
									<Table.Head class="min-w-44">Email</Table.Head>
									<Table.Head class="min-w-32">Pay rate</Table.Head>
									<Table.Head class="min-w-36">Schedule</Table.Head>
									<Table.Head class="w-28 text-right">Deductions</Table.Head>
									<Table.Head class="w-24 text-right">Actions</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each filteredEmployees as employee (employee.id)}
									<Table.Row>
										<Table.Cell class="font-medium whitespace-nowrap">
											<div class="flex min-w-0 items-center gap-3">
												<PayrollEmployeeAvatar
													firstName={employee.firstName}
													lastName={employee.lastName}
													photoUrl={employee.photoUrl}
													updatedAt={employee.updatedAt}
													class="size-8"
												/>
												<a
													href="/payroll/employees/{employee.id}/edit"
													class="hover:text-primary truncate hover:underline"
												>
													{employee.fullName}
												</a>
											</div>
										</Table.Cell>
										<Table.Cell class="text-muted-foreground whitespace-nowrap">
											{formatCell(employee.employeeCode)}
										</Table.Cell>
										<Table.Cell class="text-muted-foreground">
											{formatCell(employee.jobTitle)}
										</Table.Cell>
										<Table.Cell class="text-muted-foreground">
											<span class="block max-w-56 truncate">
												{formatCell(employee.email)}
											</span>
										</Table.Cell>
										<Table.Cell class="whitespace-nowrap">
											<div class="space-y-0.5">
												<p class="font-medium">
													{formatPayRateCents(
														employee.payRateCents,
														employee.payType,
														data.payrollCurrency
													)}
												</p>
												<p class="text-muted-foreground text-xs">
													{PAYROLL_PAY_TYPE_LABELS[employee.payType]}
												</p>
											</div>
										</Table.Cell>
										<Table.Cell class="text-muted-foreground whitespace-nowrap">
											{employee.workScheduleName ?? 'Workspace default'}
										</Table.Cell>
										<Table.Cell class="text-right whitespace-nowrap">
											{#if (employee.deductions?.length ?? 0) > 0}
												{employee.deductions.length}
											{:else}
												<span class="text-muted-foreground">None</span>
											{/if}
										</Table.Cell>
										<Table.Cell class="text-right whitespace-nowrap">
											<Button
												href="/payroll/employees/{employee.id}/edit"
												variant="outline"
												size="sm"
												class="h-8"
												aria-label="Edit {employee.fullName}"
											>
												<PencilIcon class="size-4" aria-hidden="true" />
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>

					{#if isSearching}
						<p class="text-muted-foreground mt-4 text-sm">
							Showing {filteredEmployees.length} of {employees.length} employees.
						</p>
					{/if}
				{/if}
			</Card.Content>
		{/if}
	</Card.Root>
</div>
