<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import PayrollEmployeeForm from '$lib/components/payroll/payroll-employee-form.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { PAYROLL_EMPLOYEE_CREATED_MESSAGE } from '$lib/shared/payroll/messages';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showSuccess = $state(false);

	function addAnother() {
		showSuccess = false;
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Add employee"
		description="Store compensation details for payroll processing."
	>
		{#snippet actions()}
			<Button href="/payroll/employees" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to employees
			</Button>
		{/snippet}
	</PageHeader>

	<Card.Root class="max-w-3xl">
		<Card.Header>
			<Card.Title>Employee details</Card.Title>
			<Card.Description>
				Assign pay rates, deductions, and an optional work schedule from DTR.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Employee added"
					description="The employee is now available for pay runs."
					class="mb-6"
				/>
				<div class="flex flex-wrap gap-2">
					<Button type="button" variant="outline" class="h-10" onclick={addAnother}>
						<UserPlusIcon class="size-4" aria-hidden="true" />
						Add another
					</Button>
					<Button href="/payroll/employees" class="h-10">View employees</Button>
				</div>
			{:else}
				{#key showSuccess}
					<PayrollEmployeeForm
					initialForm={data.form}
					deductionTypes={data.deductionTypes}
					workSchedules={data.workSchedules}
					jobTitles={data.jobTitles}
					payrollCurrency={data.payrollCurrency}
					resetForm={true}
					successMessage={PAYROLL_EMPLOYEE_CREATED_MESSAGE}
					onSuccess={async () => {
						showSuccess = true;
						await invalidateAll();
					}}
				>
					{#snippet actions({ submitting })}
						<Button type="submit" class="h-10" disabled={submitting}>
							{#if submitting}
								<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
								Adding employee...
							{:else}
								<UserPlusIcon class="size-4" aria-hidden="true" />
								Add employee
							{/if}
						</Button>
						<Button href="/payroll/employees" variant="outline" class="h-10">Cancel</Button>
					{/snippet}
				</PayrollEmployeeForm>
				{/key}
			{/if}
		</Card.Content>
	</Card.Root>
</div>
