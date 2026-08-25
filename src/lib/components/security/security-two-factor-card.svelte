<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import SecurityBackupCodesDialog from '$lib/components/security/security-backup-codes-dialog.svelte';
	import SecurityDisable2faDialog from '$lib/components/security/security-disable-2fa-dialog.svelte';
	import SecurityRegenerateBackupCodesDialog from '$lib/components/security/security-regenerate-backup-codes-dialog.svelte';
	import SecuritySetupEmailOtpDialog from '$lib/components/security/security-setup-email-otp-dialog.svelte';
	import SecuritySetupOptionCard from '$lib/components/security/security-setup-option-card.svelte';
	import SecuritySetupSmsOtpDialog from '$lib/components/security/security-setup-sms-otp-dialog.svelte';
	import SecuritySetupTotpDialog from '$lib/components/security/security-setup-totp-dialog.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { SOLAR } from '$lib/icons/solar-icons';
	import type { SecurityProfile } from '$lib/shared/schemas/security';
	import {
		TWO_FACTOR_PHONE_REQUIRED_MESSAGE,
		TWO_FACTOR_SETUP_FAILED_MESSAGE
	} from '$lib/shared/security-messages';
	import { cn } from '$lib/utils.js';
	import type { PageData } from '../../../routes/(app)/(settings)/security/two-factor/$types';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
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

	const setupOptions = $derived([
		{
			id: 'totp',
			icon: SOLAR.totp,
			iconClass: 'text-violet-600 dark:text-violet-400',
			title: 'Authenticator app',
			description: 'Google Authenticator or another TOTP app on your phone.',
			enabled: twoFactor.totpEnabled,
			unavailableMessage: null as string | null,
			actionBusy: startingTotp,
			onAction: startTotp
		},
		{
			id: 'sms',
			icon: SOLAR.sms,
			iconClass: 'text-sky-600 dark:text-sky-400',
			title: 'SMS verification',
			description: 'Receive a one-time code by text message.',
			enabled: twoFactor.smsEnabled,
			unavailableMessage: twoFactor.smsAvailable ? null : TWO_FACTOR_PHONE_REQUIRED_MESSAGE,
			actionBusy: false,
			onAction: () => {
				smsCodeSent = false;
				smsDialogOpen = true;
			}
		},
		{
			id: 'email',
			icon: SOLAR.twoFactorEmail,
			iconClass: 'text-rose-600 dark:text-rose-400',
			title: 'Email verification',
			description: 'Receive a one-time code at your account email.',
			enabled: twoFactor.emailEnabled,
			unavailableMessage: twoFactor.emailAvailable ? null : 'Verify your email to enable this method.',
			actionBusy: false,
			onAction: () => {
				emailCodeSent = false;
				emailDialogOpen = true;
			}
		}
	]);

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
			class={cn(
				'flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
				twoFactor.enabled
					? 'border-emerald-500/20 bg-emerald-500/5'
					: 'bg-muted/40'
			)}
		>
			<div class="flex min-w-0 items-start gap-3">
				<div
					class={cn(
						'flex size-10 shrink-0 items-center justify-center rounded-lg',
						twoFactor.enabled
							? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
							: 'bg-muted text-muted-foreground'
					)}
					aria-hidden="true"
				>
					<AppIcon
						icon={twoFactor.enabled ? SOLAR.security : SOLAR.shieldDisabled}
						size="md"
					/>
				</div>
				<div class="min-w-0 space-y-2">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-sm font-medium">Status</p>
						<Badge variant={twoFactor.enabled ? 'secondary' : 'outline'}>
							{twoFactor.enabled ? 'Enabled' : 'Disabled'}
						</Badge>
					</div>
					<p class="text-muted-foreground text-sm leading-relaxed">
						{#if twoFactor.enabled}
							{twoFactor.methods.length} verification {twoFactor.methods.length === 1
								? 'method'
								: 'methods'} active.
						{:else}
							Two-factor authentication is not enabled for your account.
						{/if}
					</p>
				</div>
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
				{#each setupOptions as option (option.id)}
					<SecuritySetupOptionCard
						icon={option.icon}
						iconClass={option.iconClass}
						title={option.title}
						description={option.description}
						enabled={option.enabled}
						unavailableMessage={option.unavailableMessage}
						actionBusy={option.actionBusy}
						onAction={option.onAction}
					/>
				{/each}
			</div>
		</div>

		{#if twoFactor.enabled}
			<div class="space-y-3">
				<p class="text-sm font-medium">Backup codes</p>
				<div
					class="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="flex min-w-0 items-start gap-3">
						<div
							class="bg-amber-500/10 text-amber-600 dark:text-amber-400 flex size-10 shrink-0 items-center justify-center rounded-lg"
							aria-hidden="true"
						>
							<AppIcon icon={SOLAR.backupCodes} size="md" />
						</div>
						<div class="space-y-1">
							<p class="text-sm font-medium">
								{twoFactor.backupCodesRemaining} unused backup
								{twoFactor.backupCodesRemaining === 1 ? 'code' : 'codes'}
							</p>
							<p class="text-muted-foreground text-sm leading-relaxed">
								Use backup codes when you cannot access your verification methods.
							</p>
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						class="h-10 shrink-0"
						onclick={() => (regenerateDialogOpen = true)}
					>
						Regenerate
					</Button>
				</div>
			</div>

			<div class="space-y-3">
				<p class="text-sm font-medium">Trusted devices</p>
				<p class="text-muted-foreground text-sm leading-relaxed">
					Devices you chose to remember skip two-factor authentication for 30 days.
				</p>
				{#if twoFactor.trustedDevices.length === 0}
					<div
						class="bg-muted/40 text-muted-foreground flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed"
					>
						<div
							class="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg"
							aria-hidden="true"
						>
							<AppIcon icon={SOLAR.trustedDevices} size="md" />
						</div>
						<p>No trusted devices yet. Choose “Remember this device” when signing in with 2FA.</p>
					</div>
				{:else}
					<ul class="space-y-2">
						{#each twoFactor.trustedDevices as device (device.id)}
							<li
								class="bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div class="flex min-w-0 items-start gap-3">
									<div
										class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
										aria-hidden="true"
									>
										<AppIcon icon={SOLAR.trustedDevices} size="md" />
									</div>
									<div class="min-w-0 space-y-1">
										<p class="text-sm font-medium">
											{device.label ?? 'Trusted device'}
										</p>
										<p class="text-muted-foreground text-xs">
											Added {formatDeviceDate(device.createdAt)} · Expires
											{formatDeviceDate(device.expiresAt)}
										</p>
									</div>
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
										<AppIcon icon={SOLAR.trash} size="sm" aria-hidden="true" />
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
