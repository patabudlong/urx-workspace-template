<script lang="ts">
	import SecurityBackupCodesDialog from '$lib/components/security/security-backup-codes-dialog.svelte';
	import SecurityDisable2faDialog from '$lib/components/security/security-disable-2fa-dialog.svelte';
	import SecurityRegenerateBackupCodesDialog from '$lib/components/security/security-regenerate-backup-codes-dialog.svelte';
	import SecuritySetupEmailOtpDialog from '$lib/components/security/security-setup-email-otp-dialog.svelte';
	import SecuritySetupSmsOtpDialog from '$lib/components/security/security-setup-sms-otp-dialog.svelte';
	import SecuritySetupTotpDialog from '$lib/components/security/security-setup-totp-dialog.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { SecurityProfile } from '$lib/shared/schemas/security';
	import {
		TWO_FACTOR_PHONE_REQUIRED_MESSAGE,
		TWO_FACTOR_SETUP_FAILED_MESSAGE
	} from '$lib/shared/security-messages';
	import type { PageData } from '../../../routes/(app)/(settings)/security/$types';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import ShieldOffIcon from '@lucide/svelte/icons/shield-off';
	import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';

	let { data, security }: { data: PageData; security: SecurityProfile } = $props();

	let totpDialogOpen = $state(false);
	let smsDialogOpen = $state(false);
	let emailDialogOpen = $state(false);
	let disableDialogOpen = $state(false);
	let regenerateDialogOpen = $state(false);
	let backupCodesDialogOpen = $state(false);
	let backupCodes = $state<string[]>([]);
	let totpSetup = $state<{ qrDataUrl: string; manualKey: string } | null>(null);
	let startingTotp = $state(false);
	let setupError = $state<string | null>(null);
	let smsCodeSent = $state(false);
	let emailCodeSent = $state(false);
	let revokingDeviceId = $state<string | null>(null);

	const twoFactor = $derived(security.twoFactor);

	function showBackupCodes(codes: string[]) {
		backupCodes = codes;
		backupCodesDialogOpen = true;
	}

	async function startTotp() {
		startingTotp = true;
		setupError = null;

		try {
			const response = await fetch('?/startTotpSetup', {
				method: 'POST',
				body: new FormData(),
				headers: { accept: 'application/json' }
			});
			const result = deserialize(await response.text());

			if (result.type !== 'success' || !result.data?.totpSetup) {
				const failureMessage =
					result.type === 'failure' &&
					result.data &&
					typeof result.data.error === 'string'
						? result.data.error
						: TWO_FACTOR_SETUP_FAILED_MESSAGE;
				setupError = failureMessage;
				return;
			}

			totpSetup = result.data.totpSetup as { qrDataUrl: string; manualKey: string };
			totpDialogOpen = true;
		} catch {
			setupError = TWO_FACTOR_SETUP_FAILED_MESSAGE;
		} finally {
			startingTotp = false;
		}
	}

	async function revokeDevice(deviceId: string) {
		revokingDeviceId = deviceId;

		try {
			const formData = new FormData();
			formData.set('deviceId', deviceId);

			await fetch('?/revokeTrustedDevice', {
				method: 'POST',
				body: formData,
				headers: { accept: 'application/json' }
			});
			await invalidateAll();
		} finally {
			revokingDeviceId = null;
		}
	}

	function formatDeviceDate(value: string): string {
		return new Intl.DateTimeFormat('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(value));
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Two-factor authentication</Card.Title>
		<Card.Description>
			Add an extra layer of security with authenticator apps, SMS, or email verification.
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<div
			class="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between {twoFactor.enabled
				? 'border-emerald-500/20 bg-emerald-500/5'
				: 'bg-muted/40'}"
		>
			<div class="min-w-0 space-y-2">
				<div class="flex flex-wrap items-center gap-2">
					<p class="text-sm font-medium">Status</p>
					<Badge variant={twoFactor.enabled ? 'secondary' : 'outline'} class="gap-1">
						{#if twoFactor.enabled}
							<ShieldCheckIcon class="size-3" aria-hidden="true" />
							Enabled
						{:else}
							<ShieldOffIcon class="size-3" aria-hidden="true" />
							Disabled
						{/if}
					</Badge>
				</div>
				<p class="text-muted-foreground text-sm">
					{#if twoFactor.enabled}
						{twoFactor.methods.length} verification {twoFactor.methods.length === 1
							? 'method'
							: 'methods'} active.
					{:else}
						Two-factor authentication is not enabled for your account.
					{/if}
				</p>
			</div>
			{#if twoFactor.enabled}
				<Button
					type="button"
					variant="outline"
					class="h-10 shrink-0"
					onclick={() => (disableDialogOpen = true)}
				>
					Disable 2FA
				</Button>
			{/if}
		</div>

		{#if setupError}
			<StatusAlert variant="danger" title="Setup failed" description={setupError} />
		{/if}

		<div class="space-y-3">
			<p class="text-sm font-medium">Setup options</p>
			<div class="grid gap-3 md:grid-cols-3">
				<div class="space-y-3 rounded-lg border p-4">
					<div class="flex items-center gap-2">
						<SmartphoneIcon class="size-4" aria-hidden="true" />
						<p class="text-sm font-medium">Authenticator app</p>
					</div>
					<p class="text-muted-foreground text-sm">Google Authenticator or similar TOTP apps.</p>
					{#if twoFactor.totpEnabled}
						<Badge variant="secondary" class="w-fit">Enabled</Badge>
					{:else}
						<Button
							type="button"
							class="h-10 w-full"
							disabled={startingTotp}
							onclick={startTotp}
						>
							{#if startingTotp}
								<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							{/if}
							Set up
						</Button>
					{/if}
				</div>

				<div class="space-y-3 rounded-lg border p-4">
					<div class="flex items-center gap-2">
						<PhoneIcon class="size-4" aria-hidden="true" />
						<p class="text-sm font-medium">SMS verification</p>
					</div>
					<p class="text-muted-foreground text-sm">Receive codes via text message.</p>
					{#if twoFactor.smsEnabled}
						<Badge variant="secondary" class="w-fit">Enabled</Badge>
					{:else if !twoFactor.smsAvailable}
						<p class="text-muted-foreground text-xs">{TWO_FACTOR_PHONE_REQUIRED_MESSAGE}</p>
					{:else}
						<Button
							type="button"
							class="h-10 w-full"
							onclick={() => {
								smsCodeSent = false;
								smsDialogOpen = true;
							}}
						>
							Set up
						</Button>
					{/if}
				</div>

				<div class="space-y-3 rounded-lg border p-4">
					<div class="flex items-center gap-2">
						<MailIcon class="size-4" aria-hidden="true" />
						<p class="text-sm font-medium">Email verification</p>
					</div>
					<p class="text-muted-foreground text-sm">Receive codes to your account email.</p>
					{#if twoFactor.emailEnabled}
						<Badge variant="secondary" class="w-fit">Enabled</Badge>
					{:else if !twoFactor.emailAvailable}
						<p class="text-muted-foreground text-xs">Verify your email to enable this method.</p>
					{:else}
						<Button
							type="button"
							class="h-10 w-full"
							onclick={() => {
								emailCodeSent = false;
								emailDialogOpen = true;
							}}
						>
							Set up
						</Button>
					{/if}
				</div>
			</div>
		</div>

		{#if twoFactor.enabled}
			<div class="space-y-3">
				<p class="text-sm font-medium">Backup codes</p>
				<div
					class="bg-muted/40 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="space-y-1">
						<p class="text-sm">
							{twoFactor.backupCodesRemaining} unused backup
							{twoFactor.backupCodesRemaining === 1 ? 'code' : 'codes'}
						</p>
						<p class="text-muted-foreground text-sm">
							Use backup codes when you cannot access your verification methods.
						</p>
					</div>
					<div class="flex shrink-0 flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							class="h-10"
							onclick={() => (regenerateDialogOpen = true)}
						>
							Regenerate
						</Button>
					</div>
				</div>
			</div>

			<div class="space-y-3">
				<p class="text-sm font-medium">Trusted devices</p>
				<p class="text-muted-foreground text-sm">
					Devices you chose to remember skip two-factor authentication for 30 days.
				</p>
				{#if twoFactor.trustedDevices.length === 0}
					<div class="bg-muted/40 rounded-lg border p-4 text-sm text-muted-foreground">
						No trusted devices yet. Choose “Remember this device” when signing in with 2FA.
					</div>
				{:else}
					<ul class="space-y-2">
						{#each twoFactor.trustedDevices as device (device.id)}
							<li
								class="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div class="min-w-0 space-y-1">
									<p class="text-sm font-medium">
										{device.label ?? 'Trusted device'}
									</p>
									<p class="text-muted-foreground text-xs">
										Added {formatDeviceDate(device.createdAt)} · Expires
										{formatDeviceDate(device.expiresAt)}
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									class="h-10 shrink-0"
									disabled={revokingDeviceId === device.id}
									onclick={() => revokeDevice(device.id)}
								>
									{#if revokingDeviceId === device.id}
										<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
									{:else}
										<Trash2Icon class="size-4" aria-hidden="true" />
									{/if}
									Remove
								</Button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</Card.Content>
</Card.Root>

<SecuritySetupTotpDialog
	bind:open={totpDialogOpen}
	{data}
	totpSetup={totpSetup}
	onBackupCodes={showBackupCodes}
/>

<SecuritySetupSmsOtpDialog
	bind:open={smsDialogOpen}
	confirmForm={data.confirmSmsForm}
	bind:codeSent={smsCodeSent}
	onBackupCodes={showBackupCodes}
/>

<SecuritySetupEmailOtpDialog
	bind:open={emailDialogOpen}
	confirmForm={data.confirmEmailForm}
	bind:codeSent={emailCodeSent}
	onBackupCodes={showBackupCodes}
/>

<SecurityDisable2faDialog bind:open={disableDialogOpen} {data} />

<SecurityRegenerateBackupCodesDialog
	bind:open={regenerateDialogOpen}
	{data}
	onBackupCodes={showBackupCodes}
/>

<SecurityBackupCodesDialog bind:open={backupCodesDialogOpen} bind:backupCodes />
