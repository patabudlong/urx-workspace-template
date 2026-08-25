<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import FormDatePicker from '$lib/components/form/form-date-picker.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import PayrollRunsTipsPanel from '$lib/components/payroll/payroll-runs-tips-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { PayrollRunDto } from '$lib/shared/models/payroll-run';
	import type { PayrollRunStatus } from '$lib/shared/payroll/schemas';
	import {
		PAYROLL_RUN_CREATED_MESSAGE,
		PAYROLL_RUN_CREATE_FAILED_MESSAGE,
		PAYROLL_RUN_DELETED_MESSAGE
	} from '$lib/shared/payroll/messages';
	import { createPayrollRunSchema } from '$lib/shared/payroll/schemas';
	import { cn } from '$lib/utils.js';
	import { parseDate } from '@internationalized/date';
	import CalendarPlusIcon from '@lucide/svelte/icons/calendar-plus';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);
	let runs = $state<PayrollRunDto[] | null>(null);
	let searchQuery = $state('');
	let tipsOpen = $state(false);

	const showDeletedAlert = $derived(page.url.searchParams.get('deleted') === '1');

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(createPayrollRunSchema),
		resetForm: true,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === PAYROLL_RUN_CREATED_MESSAGE) {
				showSuccess = true;
				await invalidateAll();
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	$effect(() => {
		const next = data.runs as Promise<PayrollRunDto[]> | PayrollRunDto[];

		if (Array.isArray(next)) {
			runs = next;
			return;
		}

		if (!next || typeof next.then !== 'function') {
			runs = [];
			return;
		}

		runs = null;

		void next.then((resolved) => {
			runs = resolved;
		});
	});

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== PAYROLL_RUN_CREATED_MESSAGE
	);

	const filteredRuns = $derived(
		runs === null
			? []
			: runs.filter((run) => {
					const query = searchQuery.trim().toLowerCase();
					if (!query) {
						return true;
					}

					return (
						run.title.toLowerCase().includes(query) ||
						run.status.toLowerCase().includes(query)
					);
				})
	);

	const isSearching = $derived(searchQuery.trim().length > 0);

	const periodEndMinValue = $derived(
		/^\d{4}-\d{2}-\d{2}$/.test($form.periodStart) ? parseDate($form.periodStart) : undefined
	);

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(new Date(value));
	}

	function formatUpdatedAt(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(value));
	}

	function statusVariant(
		status: PayrollRunStatus
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (status === 'completed') {
			return 'default';
		}

		if (status === 'failed') {
			return 'destructive';
		}

		if (status === 'draft') {
			return 'outline';
		}

		return 'secondary';
	}

	function statusLabel(status: PayrollRunStatus): string {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Pay runs"
		description="Payroll runs for the active workspace. Each run covers a pay period and tracks processing status."
	>
		{#snippet actions()}
			{#if data.payFrequencyLabel}
				<PayrollRunsTipsPanel
					bind:open={tipsOpen}
					payFrequencyLabel={data.payFrequencyLabel}
					settingsConfigured={data.settingsConfigured}
				/>
			{/if}
		{/snippet}
	</PageHeader>

	{#if showDeletedAlert}
		<StatusAlert
			variant="success"
			title="Pay run removed"
			description={PAYROLL_RUN_DELETED_MESSAGE}
		/>
	{/if}

	<div class="grid gap-6 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] xl:items-start">
		<Card.Root class="xl:sticky xl:top-6">
			<Card.Header>
				<Card.Title>Create pay run</Card.Title>
				<Card.Description>Start a draft run for a pay period.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if showSuccess}
					<StatusAlert
						variant="success"
						title="Pay run created"
						description="The draft pay run is listed in the table."
						class="mb-6"
					/>
				{:else if formError}
					<StatusAlert
						variant="danger"
						title="Could not create pay run"
						description={$formMessage === PAYROLL_RUN_CREATE_FAILED_MESSAGE
							? PAYROLL_RUN_CREATE_FAILED_MESSAGE
							: String($formMessage)}
						class="mb-6"
					/>
				{/if}

				<form method="POST" use:enhance class="space-y-5">
					<Form.Field form={superform} name="title">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Title</Form.Label>
								<Input {...props} id="payroll-run-title" bind:value={$form.title} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
						<Form.Field form={superform} name="periodStart">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>Period start</Form.Label>
									<FormDatePicker
										id={props.id}
										name={props.name}
										aria-invalid={props['aria-invalid']}
										aria-describedby={props['aria-describedby']}
										bind:value={$form.periodStart}
									/>
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>

						<Form.Field form={superform} name="periodEnd">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>Period end</Form.Label>
									<FormDatePicker
										id={props.id}
										name={props.name}
										aria-invalid={props['aria-invalid']}
										aria-describedby={props['aria-describedby']}
										bind:value={$form.periodEnd}
										minValue={periodEndMinValue}
									/>
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>
					</div>

					<Button type="submit" class="h-10 w-full" disabled={submitting}>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Creating pay run...
						{:else}
							<CalendarPlusIcon class="size-4" aria-hidden="true" />
							Create pay run
						{/if}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			{#if runs === null}
				<Card.Header>
					<Skeleton class="h-6 w-32" />
					<Skeleton class="mt-2 h-4 w-48" />
				</Card.Header>
				<Card.Content class="space-y-3">
					{#each Array.from({ length: 5 }) as _, index (index)}
						<Skeleton class="h-12 w-full" />
					{/each}
				</Card.Content>
			{:else}
				<Card.Header>
					<Card.Title>All pay runs</Card.Title>
					<Card.Description>
						{runs.length === 1 ? '1 pay run' : `${runs.length} pay runs`} · most recent first
					</Card.Description>
					{#if runs.length > 0}
						<Card.Action>
							<ListSearchInput
								bind:value={searchQuery}
								placeholder="Search pay runs..."
								ariaLabel="Search pay runs"
							/>
						</Card.Action>
					{/if}
				</Card.Header>
				<Card.Content>
					{#if runs.length === 0}
						<div class="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 py-12 text-center">
							<div
								class="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full"
							>
								<CalendarPlusIcon class="size-5" aria-hidden="true" />
							</div>
							<div class="max-w-sm space-y-1">
								<p class="font-medium">No pay runs yet</p>
								<p class="text-muted-foreground text-sm">
									Create a draft pay run to start a new pay period for your team.
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								class="h-10"
								onclick={() => {
									document.getElementById('payroll-run-title')?.focus();
								}}
							>
								Create your first run
							</Button>
						</div>
					{:else if filteredRuns.length === 0}
						<p class="text-muted-foreground text-sm">No pay runs match your search.</p>
					{:else}
						<div class="overflow-x-auto rounded-lg border">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="min-w-44">Pay run</Table.Head>
										<Table.Head class="min-w-40">Period</Table.Head>
										<Table.Head class="min-w-28">Status</Table.Head>
										<Table.Head class="hidden min-w-28 sm:table-cell">Updated</Table.Head>
										<Table.Head class="w-12" />
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each filteredRuns as run (run.id)}
										<Table.Row
											class="group cursor-pointer"
											onclick={() => goto(`/payroll/runs/${run.id}`)}
										>
											<Table.Cell class="h-px align-middle">
												<div class="flex h-full min-w-0 items-center">
													<div class="min-w-0 space-y-0.5">
														<p class="group-hover:text-primary truncate font-medium transition-colors">
															{run.title}
														</p>
														<p class="text-muted-foreground text-xs sm:hidden">
															{formatUpdatedAt(run.updatedAt)}
														</p>
													</div>
												</div>
											</Table.Cell>
											<Table.Cell class="text-muted-foreground h-px align-middle whitespace-nowrap">
												<div class="flex h-full items-center text-sm">
													{formatDate(run.periodStart)} – {formatDate(run.periodEnd)}
												</div>
											</Table.Cell>
											<Table.Cell class="h-px align-middle whitespace-nowrap">
												<div class="flex h-full items-center">
													<Badge
														variant={statusVariant(run.status)}
														class={cn(
															'capitalize',
															run.status === 'processing' && 'animate-pulse'
														)}
													>
														{#if run.status === 'completed'}
															<CircleCheckIcon aria-hidden="true" />
														{:else if run.status === 'failed'}
															<CircleXIcon aria-hidden="true" />
														{:else if run.status === 'processing'}
															<Loader2Icon class="animate-spin" aria-hidden="true" />
														{:else}
															<CircleDashedIcon aria-hidden="true" />
														{/if}
														{statusLabel(run.status)}
													</Badge>
												</div>
											</Table.Cell>
											<Table.Cell
												class="text-muted-foreground hidden h-px align-middle whitespace-nowrap sm:table-cell"
											>
												<div class="flex h-full items-center text-sm">
													{formatUpdatedAt(run.updatedAt)}
												</div>
											</Table.Cell>
											<Table.Cell class="h-px align-middle text-right">
												<div class="flex h-full items-center justify-end">
													<Button
														variant="ghost"
														size="icon-sm"
														class="text-muted-foreground group-hover:text-foreground h-8 w-8"
														href="/payroll/runs/{run.id}"
														aria-label="Open {run.title}"
														onclick={(event) => event.stopPropagation()}
													>
														<ChevronRightIcon class="size-4" aria-hidden="true" />
													</Button>
												</div>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>

						{#if isSearching}
							<p class="text-muted-foreground mt-4 text-sm">
								Showing {filteredRuns.length} of {runs.length} pay runs.
							</p>
						{/if}
					{/if}
				</Card.Content>
			{/if}
		</Card.Root>
	</div>
</div>
