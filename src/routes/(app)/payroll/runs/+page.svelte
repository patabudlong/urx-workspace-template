<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { PayrollRunDto } from '$lib/shared/models/payroll-run';
	import {
		PAYROLL_RUN_CREATED_MESSAGE,
		PAYROLL_RUN_CREATE_FAILED_MESSAGE
	} from '$lib/shared/payroll/messages';
	import { createPayrollRunSchema } from '$lib/shared/payroll/schemas';
	import CalendarPlusIcon from '@lucide/svelte/icons/calendar-plus';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);
	let runs = $state<PayrollRunDto[] | null>(null);

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

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(new Date(value));
	}

	function statusVariant(status: PayrollRunDto['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (status === 'completed') {
			return 'default';
		}

		if (status === 'failed') {
			return 'destructive';
		}

		return 'secondary';
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Pay runs"
		description="Payroll runs for the active workspace. Each run covers a pay period and tracks processing status."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Create pay run</Card.Title>
			<Card.Description>Start a draft run for a pay period.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Pay run created"
					description="The draft pay run is listed below."
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
							<Input {...props} bind:value={$form.title} />
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<div class="grid gap-5 sm:grid-cols-2">
					<Form.Field form={superform} name="periodStart">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Period start</Form.Label>
								<Input {...props} bind:value={$form.periodStart} type="date" />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={superform} name="periodEnd">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Period end</Form.Label>
								<Input {...props} bind:value={$form.periodEnd} type="date" />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>
				</div>

				<Button type="submit" class="h-10" disabled={submitting}>
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
		<Card.Header>
			<Card.Title>All pay runs</Card.Title>
			<Card.Description>Most recent pay periods appear first.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if runs === null}
				<div class="space-y-3" aria-busy="true" aria-label="Loading pay runs">
					{#each Array.from({ length: 4 }) as _, index (index)}
						<Skeleton class="h-14 w-full" />
					{/each}
				</div>
			{:else if runs.length === 0}
				<StatusAlert
					variant="info"
					title="No pay runs yet"
					description="Create a draft pay run above to start a new pay period."
				/>
			{:else}
				<ul class="divide-border divide-y">
					{#each runs as run (run.id)}
						<li class="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
							<div class="min-w-0 space-y-1">
								<p class="truncate font-medium">{run.title}</p>
								<p class="text-muted-foreground text-sm">
									{formatDate(run.periodStart)} – {formatDate(run.periodEnd)}
								</p>
							</div>
							<Badge variant={statusVariant(run.status)} class="w-fit capitalize">
								{run.status}
							</Badge>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
