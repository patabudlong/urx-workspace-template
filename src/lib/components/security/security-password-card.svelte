<script lang="ts">
	import SecurityChangePasswordDialog from '$lib/components/security/security-change-password-dialog.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { PASSWORD_CHANGE_NOT_AVAILABLE_MESSAGE } from '$lib/shared/security-messages';
	import type { SecurityProfile } from '$lib/shared/schemas/security';
	import type { PageData } from '../../../routes/(app)/(settings)/security/$types';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';

	let { data, security }: { data: PageData; security: SecurityProfile } = $props();

	let changePasswordOpen = $state(false);

	const passwordChangedLabel = $derived(
		security.passwordChangedAt
			? new Intl.DateTimeFormat('en-GB', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				}).format(new Date(security.passwordChangedAt))
			: null
	);

	const googleOnlySignIn = $derived(!security.hasAppPassword && security.hasGoogleAccount);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Password & login</Card.Title>
		<Card.Description>
			{#if googleOnlySignIn}
				You sign in with Google. Your app password is managed in your Google Account.
			{:else}
				Manage your workspace password and keep your account secure.
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		{#if googleOnlySignIn}
			<StatusAlert
				variant="info"
				title="Google sign-in"
				description={PASSWORD_CHANGE_NOT_AVAILABLE_MESSAGE}
			/>
		{:else if security.hasAppPassword}
			<div
				class="bg-muted/40 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="min-w-0 space-y-1">
					<p class="text-sm font-medium">App password</p>
					<p class="text-muted-foreground text-sm">
						{#if passwordChangedLabel}
							Last changed: {passwordChangedLabel}
						{:else}
							Password is set
						{/if}
					</p>
				</div>
				<Button type="button" class="h-10 shrink-0" onclick={() => (changePasswordOpen = true)}>
					<KeyRoundIcon class="size-4" aria-hidden="true" />
					Change password
				</Button>
			</div>
		{/if}
	</Card.Content>
</Card.Root>

{#if changePasswordOpen}
	<SecurityChangePasswordDialog bind:open={changePasswordOpen} {data} />
{/if}
