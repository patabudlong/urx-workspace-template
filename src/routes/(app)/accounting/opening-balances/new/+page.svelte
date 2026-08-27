<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { ACCOUNTING_OPENING_BALANCE_SAVE_FAILED_MESSAGE } from '$lib/shared/accounting/messages';
	import { journalFormSchema } from '$lib/shared/accounting/schemas';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(journalFormSchema),
		dataType: 'json',
		validationMethod: 'onsubmit',
		resetForm: false,
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: () => {
			submitting = false;
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	function addLine() {
		$form.lines = [...$form.lines, { accountId: '', description: '', debit: '', credit: '' }];
	}

	function removeLine(index: number) {
		if ($form.lines.length <= 2) {
			return;
		}

		$form.lines = $form.lines.filter((_, lineIndex) => lineIndex !== index);
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Accounting"
		title="Post opening balance"
		description="Record beginning balances for {data.firstPeriod?.label ?? 'the first fiscal period'}. Post this before other journals in that period."
	/>

	{#if typeof $formMessage === 'string' && $formMessage.length > 0}
		<StatusAlert
			variant="danger"
			title="Could not post opening balance"
			description={$formMessage === ACCOUNTING_OPENING_BALANCE_SAVE_FAILED_MESSAGE
				? ACCOUNTING_OPENING_BALANCE_SAVE_FAILED_MESSAGE
				: $formMessage}
		/>
	{/if}

	<form method="POST" use:enhance class="space-y-6">
		<input type="hidden" name="periodId" value={$form.periodId} />

		<Card.Root>
			<Card.Header>
				<Card.Title>Header</Card.Title>
			</Card.Header>
			<Card.Content class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label>Fiscal period</Label>
					<Input value={data.firstPeriod?.label ?? ''} disabled />
				</div>

				<div class="space-y-2">
					<Label for="entryDate">Entry date</Label>
					<Input id="entryDate" name="entryDate" type="date" bind:value={$form.entryDate} required />
				</div>

				<div class="space-y-2">
					<Label for="reference">Reference</Label>
					<Input id="reference" name="reference" bind:value={$form.reference} />
				</div>

				<div class="space-y-2">
					<Label for="memo">Memo</Label>
					<Input id="memo" name="memo" bind:value={$form.memo} />
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between gap-4">
				<div>
					<Card.Title>Lines</Card.Title>
					<Card.Description>Enter each account's beginning debit or credit balance.</Card.Description>
				</div>
				<Button type="button" variant="outline" size="sm" onclick={addLine}>
					<PlusIcon class="size-4" />
					Add line
				</Button>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#each $form.lines as line, index (index)}
					<div class="grid gap-3 rounded-lg border p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
						<div class="space-y-2">
							<Label for={`account-${index}`}>Account</Label>
							<select
								id={`account-${index}`}
								name={`lines[${index}].accountId`}
								class="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
								bind:value={line.accountId}
								required
							>
								<option value="">Select account</option>
								{#each data.accounts as account (account.id)}
									<option value={account.id}>{account.code} — {account.name}</option>
								{/each}
							</select>
						</div>

						<div class="space-y-2">
							<Label for={`debit-${index}`}>Debit (PHP)</Label>
							<Input
								id={`debit-${index}`}
								name={`lines[${index}].debit`}
								inputmode="decimal"
								bind:value={line.debit}
							/>
						</div>

						<div class="space-y-2">
							<Label for={`credit-${index}`}>Credit (PHP)</Label>
							<Input
								id={`credit-${index}`}
								name={`lines[${index}].credit`}
								inputmode="decimal"
								bind:value={line.credit}
							/>
						</div>

						<div class="space-y-2 md:col-span-1">
							<Label for={`description-${index}`}>Line memo</Label>
							<Input
								id={`description-${index}`}
								name={`lines[${index}].description`}
								bind:value={line.description}
							/>
						</div>

						<div class="flex items-end">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={$form.lines.length <= 2}
								onclick={() => removeLine(index)}
								aria-label="Remove line"
							>
								<Trash2Icon class="size-4" />
							</Button>
						</div>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>

		<div class="flex justify-end">
			<Button type="submit" disabled={submitting}>
				{#if submitting}
					<Loader2Icon class="size-4 animate-spin" />
					Posting…
				{:else}
					Post opening balance
				{/if}
			</Button>
		</div>
	</form>
</div>
