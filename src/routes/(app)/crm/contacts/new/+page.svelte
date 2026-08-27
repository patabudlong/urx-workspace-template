<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { CRM_CONTACT_CREATE_FAILED_MESSAGE } from '$lib/shared/crm/messages';
	import { crmContactFormSchema } from '$lib/shared/crm/schemas';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(crmContactFormSchema),
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
		title="Add contact"
		description="Create a person record linked to your customer relationships."
	>
		{#snippet actions()}
			<Button href="/crm/contacts" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to contacts
			</Button>
		{/snippet}
	</PageHeader>

	{#if typeof $formMessage === 'string' && $formMessage.length > 0}
		<StatusAlert
			variant="danger"
			title="Could not create contact"
			description={$formMessage === CRM_CONTACT_CREATE_FAILED_MESSAGE
				? CRM_CONTACT_CREATE_FAILED_MESSAGE
				: $formMessage}
		/>
	{/if}

	<form method="POST" use:enhance class="max-w-2xl space-y-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>Contact details</Card.Title>
				<Card.Description>Basic profile information for this contact.</Card.Description>
			</Card.Header>
			<Card.Content class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="firstName">First name</Label>
					<Input id="firstName" name="firstName" bind:value={$form.firstName} required />
				</div>

				<div class="space-y-2">
					<Label for="lastName">Last name</Label>
					<Input id="lastName" name="lastName" bind:value={$form.lastName} required />
				</div>

				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" bind:value={$form.email} autocomplete="email" />
				</div>

				<div class="space-y-2">
					<Label for="phone">Phone</Label>
					<Input id="phone" name="phone" type="tel" bind:value={$form.phone} autocomplete="tel" />
				</div>

				<div class="space-y-2">
					<Label for="title">Job title</Label>
					<Input id="title" name="title" bind:value={$form.title} />
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
					Creating contact...
				{:else}
					<UserPlusIcon class="size-4" aria-hidden="true" />
					Create contact
				{/if}
			</Button>
			<Button href="/crm/contacts" variant="outline" class="h-10">Cancel</Button>
		</div>
	</form>
</div>
