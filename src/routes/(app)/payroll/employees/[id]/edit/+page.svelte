<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import PayrollDeactivateEmployeeDialog from '$lib/components/payroll/payroll-deactivate-employee-dialog.svelte';
	import PayrollEmployeeAvatar from '$lib/components/payroll/payroll-employee-avatar.svelte';
	import PayrollEmployeeForm from '$lib/components/payroll/payroll-employee-form.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { PAYROLL_EMPLOYEE_UPDATED_MESSAGE } from '$lib/shared/payroll/messages';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let deactivating = $state(false);
	let deactivateDialogOpen = $state(false);
	let showSuccess = $state(false);

	const deactivateEnhance: SubmitFunction = () => {
		deactivating = true;
		deactivateDialogOpen = false;

		return async ({ update }) => {
			await update();
			deactivating = false;
		};
	};
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Edit employee"
		description="Update compensation details for {data.employee.fullName}."
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
				Changes apply to future pay runs. Past runs are not recalculated automatically.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="bg-muted/30 mb-6 flex items-center gap-4 rounded-xl border p-4">
				<PayrollEmployeeAvatar
					firstName={data.employee.firstName}
					lastName={data.employee.lastName}
					photoUrl={data.employee.photoUrl}
					updatedAt={data.employee.updatedAt}
					class="size-16 text-lg"
				/>
				<div class="min-w-0">
					<p class="truncate text-lg font-semibold tracking-tight">{data.employee.fullName}</p>
					{#if data.employee.email}
						<p class="text-muted-foreground truncate text-sm">{data.employee.email}</p>
					{/if}
					{#if data.employee.jobTitle}
						<p class="text-muted-foreground truncate text-sm">{data.employee.jobTitle}</p>
					{/if}
				</div>
			</div>

			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Employee updated"
					description="Compensation details were saved for this employee."
					class="mb-6"
				/>
			{/if}

			<PayrollEmployeeForm
				initialForm={data.form}
				deductionTypes={data.deductionTypes}
				workSchedules={data.workSchedules}
				jobTitles={data.jobTitles}
				payrollCurrency={data.payrollCurrency}
				currentPhotoUrl={data.employeePhotoUrl}
				formAction="?/update"
				successMessage={PAYROLL_EMPLOYEE_UPDATED_MESSAGE}
				onSuccess={async () => {
					showSuccess = true;
					await invalidateAll();
				}}
			>
				{#snippet actions({ submitting })}
					<Button type="submit" class="h-10" disabled={submitting || deactivating}>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Saving changes...
						{:else}
							Save changes
						{/if}
					</Button>
					<Button href="/payroll/employees" variant="outline" class="h-10">Cancel</Button>
				{/snippet}
			</PayrollEmployeeForm>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-destructive/30 max-w-3xl">
		<Card.Header>
			<Card.Title>Deactivate employee</Card.Title>
			<Card.Description>
				Remove {data.employee.fullName} from active payroll. Their record is kept for history and DTR
				references, but they will no longer appear in employee lists or new pay runs.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<PayrollDeactivateEmployeeDialog
				bind:open={deactivateDialogOpen}
				employeeName={data.employee.fullName}
				submitting={deactivating}
				enhanceAction={deactivateEnhance}
			/>
		</Card.Content>
	</Card.Root>
</div>
