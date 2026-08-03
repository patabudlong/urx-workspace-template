<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		PROFILE_UPDATE_FAILED_MESSAGE,
		PROFILE_UPDATED_MESSAGE
	} from '$lib/shared/account-messages';
	import { updateProfileSchema } from '$lib/shared/schemas/account';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(updateProfileSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === PROFILE_UPDATED_MESSAGE) {
				showSuccess = true;
				await invalidateAll();
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== PROFILE_UPDATED_MESSAGE
			? $formMessage
			: null
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Profile details</Card.Title>
		<Card.Description>
			Update the name shown across your workspace and on invitations you send.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" action="?/updateProfile" use:enhance class="max-w-xl space-y-5">
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Profile updated"
					description="Your profile details have been saved."
				/>
			{:else if formError}
				<StatusAlert
					variant="danger"
					title={formError === PROFILE_UPDATE_FAILED_MESSAGE
						? 'Update failed'
						: 'Could not save profile'}
					description={formError}
				/>
			{/if}

			<div class="grid gap-4 sm:grid-cols-2">
				<Form.Field form={superform} name="firstName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>First name</Form.Label>
							<Input
								{...props}
								type="text"
								autocomplete="given-name"
								disabled={submitting}
								bind:value={$form.firstName}
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="lastName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Last name</Form.Label>
							<Input
								{...props}
								type="text"
								autocomplete="family-name"
								disabled={submitting}
								bind:value={$form.lastName}
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>
			</div>

			<Button type="submit" class="h-10" disabled={submitting}>
				{#if submitting}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Saving…
				{:else}
					Save changes
				{/if}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
