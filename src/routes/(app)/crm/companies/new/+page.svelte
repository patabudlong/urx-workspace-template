<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { CRM_COMPANY_CREATE_FAILED_MESSAGE } from '$lib/shared/crm/messages';
	import { crmCompanyFormSchema } from '$lib/shared/crm/schemas';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(crmCompanyFormSchema),
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
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="CRM"
		title="Add company"
		description="Create an organization record for your pipeline."
	>
		{#snippet actions()}
			<Button href="/crm/companies" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to companies
			</Button>
		{/snippet}
	</PageHeader>

	{#if typeof $formMessage === 'string' && $formMessage.length > 0}
		<StatusAlert
			variant="danger"
			title="Could not create company"
			description={$formMessage === CRM_COMPANY_CREATE_FAILED_MESSAGE
				? CRM_COMPANY_CREATE_FAILED_MESSAGE
				: $formMessage}
		/>
	{/if}

	<form method="POST" use:enhance class="max-w-2xl space-y-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>Company details</Card.Title>
			</Card.Header>
			<Card.Content class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2 md:col-span-2">
					<Label for="name">Company name</Label>
					<Input id="name" name="name" bind:value={$form.name} required />
				</div>

				<div class="space-y-2">
					<Label for="domain">Website domain</Label>
					<Input id="domain" name="domain" bind:value={$form.domain} />
				</div>

				<div class="space-y-2">
					<Label for="industry">Industry</Label>
					<Input id="industry" name="industry" bind:value={$form.industry} />
				</div>

				<div class="space-y-2">
					<Label for="phone">Phone</Label>
					<Input id="phone" name="phone" type="tel" bind:value={$form.phone} autocomplete="tel" />
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
					Creating company...
				{:else}
					<Building2Icon class="size-4" aria-hidden="true" />
					Create company
				{/if}
			</Button>
			<Button href="/crm/companies" variant="outline" class="h-10">Cancel</Button>
		</div>
	</form>
</div>
