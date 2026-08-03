<script lang="ts">
	import ProfileVerifyPhoneDialog from '$lib/components/account/profile-verify-phone-dialog.svelte';
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PhoneCountryInput from '$lib/components/onboarding/phone-country-input.svelte';
	import PhoneNumberDisplay from '$lib/components/phone-number-display.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import {
		PHONE_ALREADY_IN_USE_MESSAGE,
		PHONE_UPDATED_MESSAGE,
		PHONE_UPDATE_FAILED_MESSAGE
	} from '$lib/shared/account-messages';
	import { ACCOUNT_WARNING_BADGE_CLASS } from '$lib/shared/account-ui';
	import { isAuthRateLimitMessage } from '$lib/shared/auth-messages';
	import type { PageData } from '../../../routes/(app)/(settings)/account/$types';
	import { updatePhoneNumberSchema, type UserProfile } from '$lib/shared/schemas/account';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data, profile }: { data: PageData; profile: UserProfile } = $props();

	let savingPhone = $state(false);
	let phoneSaveSuccess = $state(false);
	let verifyDialogOpen = $state(false);
	let phoneFormRateLimited = $state(false);

	const phoneSuperform = superForm(untrack(() => data.phoneForm), {
		id: 'phoneForm',
		validators: zod4Client(updatePhoneNumberSchema),
		resetForm: false,
		onSubmit: () => {
			savingPhone = true;
			phoneSaveSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			savingPhone = false;

			if (updatedForm.message === PHONE_UPDATED_MESSAGE) {
				phoneSaveSuccess = true;
				await invalidateAll();
			}
		},
		onError: () => {
			savingPhone = false;
		}
	});

	const {
		enhance: enhancePhone,
		form: phoneForm,
		message: phoneFormMessage
	} = phoneSuperform;

	const phoneFormError = $derived(
		$phoneFormMessage &&
			$phoneFormMessage !== PHONE_UPDATED_MESSAGE &&
			!isAuthRateLimitMessage($phoneFormMessage)
			? typeof $phoneFormMessage === 'string'
				? $phoneFormMessage
				: null
			: null
	);

	const phoneRateLimitMessage = $derived(
		isAuthRateLimitMessage($phoneFormMessage) ? $phoneFormMessage : null
	);

	const needsVerification = $derived(Boolean(profile.phoneNumber) && !profile.phoneVerified);

	$effect(() => {
		if (needsVerification && phoneSaveSuccess) {
			verifyDialogOpen = true;
		}
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Contact number</Card.Title>
		<Card.Description>
			Add a mobile number for account recovery and notifications. Verification is required.
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		{#if needsVerification}
			<StatusAlert
				variant="warning"
				title="Verification required"
				description="We sent a 6-digit code to your phone. Verify your number to finish setup."
			/>
			<div
				class="border-amber-500/20 bg-amber-500/5 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="min-w-0 space-y-2">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-sm font-medium">Pending verification</p>
						<Badge variant="outline" class={cn(ACCOUNT_WARNING_BADGE_CLASS)}>
							Unverified
						</Badge>
					</div>
					<PhoneNumberDisplay phoneNumber={profile.phoneNumber} class="text-base font-medium" />
				</div>
				<Button type="button" class="h-10 shrink-0" onclick={() => (verifyDialogOpen = true)}>
					<ShieldCheckIcon class="size-4" aria-hidden="true" />
					Verify now
				</Button>
			</div>
		{:else if profile.phoneNumber && profile.phoneVerified}
			<div
				class="border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="min-w-0 space-y-1">
					<p class="text-sm font-medium">Verified contact number</p>
					<PhoneNumberDisplay phoneNumber={profile.phoneNumber} class="text-base font-medium" />
				</div>
				<Badge variant="secondary" class="w-fit shrink-0 gap-1">
					<ShieldCheckIcon class="size-3" aria-hidden="true" />
					Verified
				</Badge>
			</div>
		{/if}

		<form method="POST" action="?/updatePhoneNumber" use:enhancePhone class="max-w-xl space-y-5">
			{#if phoneSaveSuccess && needsVerification}
				<StatusAlert
					variant="info"
					title="Code sent"
					description="Enter the verification code in the dialog to confirm your number."
				/>
			{:else if phoneSaveSuccess}
				<StatusAlert
					variant="success"
					title="Contact number saved"
					description="Your contact number has been updated."
				/>
			{:else if phoneRateLimitMessage}
				<AuthFormMessageAlert
					message={phoneRateLimitMessage}
					bind:limited={phoneFormRateLimited}
				/>
			{:else if phoneFormError}
				<StatusAlert
					variant="danger"
					title={phoneFormError === PHONE_ALREADY_IN_USE_MESSAGE
						? 'Number already in use'
						: 'Could not save contact number'}
					description={phoneFormError}
				/>
			{/if}

			<Form.Field form={phoneSuperform} name="phoneNumber">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Mobile number</Form.Label>
						<PhoneCountryInput
							id={props.id}
							name={props.name}
							aria-invalid={props['aria-invalid']}
							aria-describedby={props['aria-describedby']}
							disabled={savingPhone}
							bind:value={$phoneForm.phoneNumber}
						/>
					{/snippet}
				</Form.Control>
				<SingleFieldErrors />
			</Form.Field>

			<p class="text-muted-foreground text-xs leading-relaxed">
				Choose your country and enter your mobile number. Local dev SMS appears in SMSPit at
				http://localhost:2875 when SMS_PROVIDER=smspitt.
			</p>

			<Button type="submit" class="h-10" disabled={savingPhone || phoneFormRateLimited}>
				{#if savingPhone}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Saving…
				{:else}
					Save contact number
				{/if}
			</Button>
		</form>
	</Card.Content>
</Card.Root>

{#if needsVerification}
	<ProfileVerifyPhoneDialog bind:open={verifyDialogOpen} {data} phoneNumber={profile.phoneNumber} />
{/if}
