<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { CRM_DEAL_CREATE_FAILED_MESSAGE } from '$lib/shared/crm/messages';
	import { CRM_DEAL_STAGES } from '$lib/shared/models/crm-deal';
	import { crmDealFormSchema } from '$lib/shared/crm/schemas';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import HandshakeIcon from '@lucide/svelte/icons/handshake';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);

	const stageLabels: Record<string, string> = {
		[CRM_DEAL_STAGES.LEAD]: 'Lead',
		[CRM_DEAL_STAGES.QUALIFIED]: 'Qualified',
		[CRM_DEAL_STAGES.PROPOSAL]: 'Proposal',
		[CRM_DEAL_STAGES.NEGOTIATION]: 'Negotiation',
		[CRM_DEAL_STAGES.WON]: 'Won',
		[CRM_DEAL_STAGES.LOST]: 'Lost'
	};

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(crmDealFormSchema),
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

	function formatContactName(contact: { firstName: string; lastName: string }): string {
		return `${contact.firstName} ${contact.lastName}`.trim();
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="CRM"
		title="Add deal"
		description="Create a new opportunity in your sales pipeline."
	>
		{#snippet actions()}
			<Button href="/crm/deals" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to deals
			</Button>
		{/snippet}
	</PageHeader>

	{#if typeof $formMessage === 'string' && $formMessage.length > 0}
		<StatusAlert
			variant="danger"
			title="Could not create deal"
			description={$formMessage === CRM_DEAL_CREATE_FAILED_MESSAGE
				? CRM_DEAL_CREATE_FAILED_MESSAGE
				: $formMessage}
		/>
	{/if}

	<form method="POST" use:enhance class="max-w-2xl space-y-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>Deal details</Card.Title>
			</Card.Header>
			<Card.Content class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2 md:col-span-2">
					<Label for="title">Deal title</Label>
					<Input id="title" name="title" bind:value={$form.title} required />
				</div>

				<div class="space-y-2">
					<Label for="stage">Stage</Label>
					<select
						id="stage"
						name="stage"
						class="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
						bind:value={$form.stage}
					>
						{#each Object.values(CRM_DEAL_STAGES) as stage (stage)}
							<option value={stage}>{stageLabels[stage]}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="expectedCloseDate">Expected close date</Label>
					<Input
						id="expectedCloseDate"
						name="expectedCloseDate"
						type="date"
						bind:value={$form.expectedCloseDate}
					/>
				</div>

				<div class="space-y-2">
					<Label for="value">Value</Label>
					<Input id="value" name="value" inputmode="decimal" bind:value={$form.value} />
				</div>

				<div class="space-y-2">
					<Label for="currency">Currency</Label>
					<Input id="currency" name="currency" bind:value={$form.currency} maxlength={3} />
				</div>

				<div class="space-y-2">
					<Label for="contactId">Contact</Label>
					<select
						id="contactId"
						name="contactId"
						class="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
						bind:value={$form.contactId}
					>
						<option value="">No contact</option>
						{#each data.contacts as contact (contact.id)}
							<option value={contact.id}>{formatContactName(contact)}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="companyId">Company</Label>
					<select
						id="companyId"
						name="companyId"
						class="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
						bind:value={$form.companyId}
					>
						<option value="">No company</option>
						{#each data.companies as company (company.id)}
							<option value={company.id}>{company.name}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2 md:col-span-2">
					<Label for="notes">Notes</Label>
					<Textarea id="notes" name="notes" rows={4} bind:value={$form.notes} />
				</div>
			</Card.Content>
		</Card.Root>

		<div class="flex flex-wrap gap-2">
			<Button type="submit" class="h-10" disabled={submitting}>
				{#if submitting}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Creating deal...
				{:else}
					<HandshakeIcon class="size-4" aria-hidden="true" />
					Create deal
				{/if}
			</Button>
			<Button href="/crm/deals" variant="outline" class="h-10">Cancel</Button>
		</div>
	</form>
</div>
