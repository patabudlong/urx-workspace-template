<script lang="ts">
	import ProfileAddPhoneDialog from '$lib/components/account/profile-add-phone-dialog.svelte';
	import ProfileVerifyPhoneDialog from '$lib/components/account/profile-verify-phone-dialog.svelte';
	import PhoneNumberDisplay from '$lib/components/phone-number-display.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { ACCOUNT_WARNING_BADGE_CLASS } from '$lib/shared/account-ui';
	import type { PageData } from '../../../routes/(app)/(settings)/account/$types';
	import type { UserProfile } from '$lib/shared/schemas/account';
	import { cn } from '$lib/utils.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';

	let { data, profile }: { data: PageData; profile: UserProfile } = $props();

	let addDialogOpen = $state(false);
	let verifyDialogOpen = $state(false);
	let phoneDialogMode = $state<'add' | 'change'>('add');
	let pendingVerification = $state(false);

	const needsVerification = $derived(Boolean(profile.phoneNumber) && !profile.phoneVerified);
	const hasPhone = $derived(Boolean(profile.phoneNumber));

	function openAddDialog() {
		phoneDialogMode = 'add';
		addDialogOpen = true;
	}

	function openChangeDialog() {
		phoneDialogMode = 'change';
		addDialogOpen = true;
	}

	function handlePhoneSaved() {
		pendingVerification = true;
	}

	$effect(() => {
		if (pendingVerification && needsVerification) {
			verifyDialogOpen = true;
			pendingVerification = false;
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
				<div class="flex shrink-0 flex-wrap gap-2">
					<Button type="button" variant="outline" class="h-10" onclick={openChangeDialog}>
						<PencilIcon class="size-4" aria-hidden="true" />
						Change
					</Button>
					<Button type="button" class="h-10" onclick={() => (verifyDialogOpen = true)}>
						<ShieldCheckIcon class="size-4" aria-hidden="true" />
						Verify now
					</Button>
				</div>
			</div>
		{:else if profile.phoneNumber && profile.phoneVerified}
			<div
				class="border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="min-w-0 space-y-1">
					<p class="text-sm font-medium">Verified contact number</p>
					<PhoneNumberDisplay phoneNumber={profile.phoneNumber} class="text-base font-medium" />
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<Badge variant="secondary" class="w-fit gap-1">
						<ShieldCheckIcon class="size-3" aria-hidden="true" />
						Verified
					</Badge>
					<Button type="button" variant="outline" class="h-10" onclick={openChangeDialog}>
						<PencilIcon class="size-4" aria-hidden="true" />
						Change
					</Button>
				</div>
			</div>
		{:else}
			<div class="max-w-xl space-y-4">
				<div class="space-y-2">
					<Label>Mobile number</Label>
					<div
						class="bg-muted/40 text-muted-foreground flex h-10 items-center gap-2 rounded-lg border px-3 text-sm"
					>
						<PhoneIcon class="size-4 shrink-0 opacity-60" aria-hidden="true" />
						No contact number added
					</div>
				</div>
				<Button type="button" class="h-10" onclick={openAddDialog}>
					<PlusIcon class="size-4" aria-hidden="true" />
					Add contact number
				</Button>
			</div>
		{/if}
	</Card.Content>
</Card.Root>

<ProfileAddPhoneDialog
	bind:open={addDialogOpen}
	{data}
	mode={phoneDialogMode}
	onSaved={handlePhoneSaved}
/>

{#if hasPhone}
	<ProfileVerifyPhoneDialog bind:open={verifyDialogOpen} {data} phoneNumber={profile.phoneNumber} />
{/if}
