<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { whenDialogCloses } from '$lib/forms/superform-dialog';
	import type {
		WorkspaceModuleIntegrationCredentialsGenerateResult,
		WorkspaceModuleIntegrationCredentialsStatus
	} from '$lib/shared/models/workspace-module-integration-credentials';
	import {
		WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_GENERATE_FAILED_MESSAGE,
		WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_GENERATED_MESSAGE,
		WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_REGENERATE_CONFIRM_MESSAGE,
		WORKSPACE_MODULE_INTEGRATION_SETTINGS_LOAD_FAILED_MESSAGE,
		WORKSPACE_MODULE_INTEGRATION_SETTINGS_SAVE_FAILED_MESSAGE,
		WORKSPACE_MODULE_INTEGRATION_SETTINGS_SAVED_MESSAGE
	} from '$lib/shared/workspace-modules-messages';
	import {
		getDefaultAuthBaseUriForPackage,
		workspaceModuleIntegrationAuthBaseUriSchema
	} from '$lib/shared/workspace-module-integrations';
	import type { WorkspacePackageMeta } from '$lib/shared/workspace-packages';
	import { cn } from '$lib/utils.js';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		workspacePackage
	}: {
		open?: boolean;
		workspacePackage: WorkspacePackageMeta;
	} = $props();

	let loading = $state(false);
	let saving = $state(false);
	let generating = $state(false);
	let configured = $state(false);
	let showSuccess = $state(false);
	let showGeneratedNotice = $state(false);
	let loadError = $state<string | null>(null);
	let saveError = $state<string | null>(null);
	let generateError = $state<string | null>(null);
	let authBaseUriError = $state<string | null>(null);
	let copiedField = $state<'clientId' | 'clientSecret' | null>(null);

	let clientId = $state('');
	let revealedClientSecret = $state<string | null>(null);
	let authBaseUri = $state('');

	const integrationApiPath = $derived(
		`/api/v1/modules/integrations/${encodeURIComponent(workspacePackage.id)}`
	);

	const clientSecretDisplay = $derived(
		revealedClientSecret ?? (configured ? '••••••••••••••••••••••••' : '')
	);

	function resetTransientState() {
		showSuccess = false;
		showGeneratedNotice = false;
		loadError = null;
		saveError = null;
		generateError = null;
		authBaseUriError = null;
		copiedField = null;
		saving = false;
		generating = false;
	}

	function resetFormFields() {
		configured = false;
		clientId = '';
		revealedClientSecret = null;
		authBaseUri = getDefaultAuthBaseUriForPackage(workspacePackage.id);
	}

	function applyStatus(status: WorkspaceModuleIntegrationCredentialsStatus) {
		configured = status.configured;
		clientId = status.clientId ?? '';
		revealedClientSecret = null;
		authBaseUri =
			status.authBaseUri ?? getDefaultAuthBaseUriForPackage(workspacePackage.id);
	}

	function applyGeneratedResult(result: WorkspaceModuleIntegrationCredentialsGenerateResult) {
		applyStatus(result);
		revealedClientSecret = result.clientSecret ?? null;
		showGeneratedNotice = Boolean(result.clientSecret);
	}

	async function loadIntegrationSettings() {
		loading = true;
		resetTransientState();
		resetFormFields();

		try {
			const response = await fetch(integrationApiPath);
			const payload = (await response.json()) as {
				data?: WorkspaceModuleIntegrationCredentialsStatus;
				error?: { message?: string };
			};

			if (!response.ok) {
				loadError = payload.error?.message ?? WORKSPACE_MODULE_INTEGRATION_SETTINGS_LOAD_FAILED_MESSAGE;
				return;
			}

			if (payload.data) {
				applyStatus(payload.data);
			}
		} catch {
			loadError = WORKSPACE_MODULE_INTEGRATION_SETTINGS_LOAD_FAILED_MESSAGE;
		} finally {
			loading = false;
		}
	}

	async function generateCredentials() {
		const isRegenerate = configured;

		if (isRegenerate && !confirm(WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_REGENERATE_CONFIRM_MESSAGE)) {
			return;
		}

		generating = true;
		generateError = null;
		showSuccess = false;
		showGeneratedNotice = false;
		revealedClientSecret = null;

		try {
			const response = await fetch(integrationApiPath, { method: 'POST' });
			const payload = (await response.json()) as {
				data?: WorkspaceModuleIntegrationCredentialsGenerateResult;
				error?: { message?: string };
			};

			if (!response.ok) {
				generateError =
					payload.error?.message ?? WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_GENERATE_FAILED_MESSAGE;
				return;
			}

			if (payload.data) {
				applyGeneratedResult(payload.data);
				toast.success(isRegenerate ? 'Credentials regenerated' : 'Credentials generated', {
					description: WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_GENERATED_MESSAGE
				});
			}
		} catch {
			generateError = WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_GENERATE_FAILED_MESSAGE;
		} finally {
			generating = false;
		}
	}

	async function saveAuthBaseUri() {
		authBaseUriError = null;
		saveError = null;
		showSuccess = false;

		const parsed = workspaceModuleIntegrationAuthBaseUriSchema.safeParse({ authBaseUri });

		if (!parsed.success) {
			authBaseUriError =
				parsed.error.issues[0]?.message ?? 'Enter a valid authentication base URI.';
			return;
		}

		saving = true;

		try {
			const response = await fetch(integrationApiPath, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(parsed.data)
			});

			const payload = (await response.json()) as {
				data?: WorkspaceModuleIntegrationCredentialsStatus;
				error?: { message?: string };
			};

			if (!response.ok) {
				saveError =
					payload.error?.message ?? WORKSPACE_MODULE_INTEGRATION_SETTINGS_SAVE_FAILED_MESSAGE;
				return;
			}

			if (payload.data) {
				applyStatus(payload.data);
			}

			showSuccess = true;
			toast.success('Integration settings saved', {
				description: `${workspacePackage.label} authentication base URI was updated.`
			});
		} catch {
			saveError = WORKSPACE_MODULE_INTEGRATION_SETTINGS_SAVE_FAILED_MESSAGE;
		} finally {
			saving = false;
		}
	}

	async function copyValue(field: 'clientId' | 'clientSecret', value: string) {
		if (!value) {
			return;
		}

		await navigator.clipboard.writeText(value);
		copiedField = field;
		setTimeout(() => {
			copiedField = null;
		}, 2000);
	}

	function resetDialogState() {
		resetTransientState();
		resetFormFields();
		loading = false;
	}

	$effect(() => {
		if (open) {
			void loadIntegrationSettings();
		}
	});
</script>

<Dialog.Root
	bind:open
	onOpenChange={(value) => whenDialogCloses(value, resetDialogState)}
>
	<Dialog.Content class="gap-6 sm:max-w-lg" showCloseButton={true}>
		<Dialog.Header class="space-y-2 text-left">
			<Dialog.Title>Integration settings</Dialog.Title>
			<Dialog.Description>
				Generate API credentials for connecting external apps to {workspacePackage.label}.
			</Dialog.Description>
		</Dialog.Header>

		{#if loading}
			<div class="space-y-5">
				<div class="space-y-2">
					<Skeleton class="h-4 w-20" />
					<Skeleton class="h-10 w-full" />
				</div>
				<div class="space-y-2">
					<Skeleton class="h-4 w-24" />
					<Skeleton class="h-10 w-full" />
				</div>
				<div class="space-y-2">
					<Skeleton class="h-4 w-40" />
					<Skeleton class="h-10 w-full" />
				</div>
			</div>
		{:else}
			{#if loadError}
				<StatusAlert variant="danger" title="Unable to load settings" description={loadError} />
			{/if}

			{#if showGeneratedNotice}
				<StatusAlert
					variant="warning"
					title="Copy your client secret"
					description={WORKSPACE_MODULE_INTEGRATION_CREDENTIALS_GENERATED_MESSAGE}
				/>
			{/if}

			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Settings saved"
					description={WORKSPACE_MODULE_INTEGRATION_SETTINGS_SAVED_MESSAGE}
				/>
			{/if}

			{#if saveError}
				<StatusAlert variant="danger" title="Unable to save settings" description={saveError} />
			{/if}

			{#if generateError}
				<StatusAlert
					variant="danger"
					title="Unable to generate credentials"
					description={generateError}
				/>
			{/if}

			<div class="space-y-5">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div class="space-y-1">
						<p class="text-sm font-medium">Client credentials</p>
						<p class="text-muted-foreground text-sm">
							{configured
								? 'Regenerate to issue a new client ID and secret.'
								: 'Generate credentials to connect apps to this module.'}
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						class="h-10 shrink-0"
						disabled={generating || saving || Boolean(loadError)}
						onclick={generateCredentials}
					>
						{#if generating}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							{configured ? 'Regenerating…' : 'Generating…'}
						{:else}
							<RefreshCwIcon class="size-4" aria-hidden="true" />
							{configured ? 'Regenerate' : 'Generate credentials'}
						{/if}
					</Button>
				</div>

				<div class="space-y-2">
					<Label for="integration-client-id">Client ID</Label>
					<div class="flex gap-2">
						<Input
							id="integration-client-id"
							value={clientId}
							readonly
							class="font-mono text-sm"
							placeholder="Generate credentials to create a client ID"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							class="size-10 shrink-0"
							disabled={!clientId}
							aria-label="Copy client ID"
							onclick={() => copyValue('clientId', clientId)}
						>
							<CopyIcon class="size-4" aria-hidden="true" />
						</Button>
					</div>
					{#if copiedField === 'clientId'}
						<p class="text-muted-foreground text-sm">Client ID copied.</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="integration-client-secret">Client Secret</Label>
					<div class="flex gap-2">
						<Input
							id="integration-client-secret"
							value={clientSecretDisplay}
							readonly
							class="font-mono text-sm"
							placeholder="Generate credentials to create a client secret"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							class="size-10 shrink-0"
							disabled={!revealedClientSecret}
							aria-label="Copy client secret"
							onclick={() =>
								revealedClientSecret && copyValue('clientSecret', revealedClientSecret)}
						>
							<CopyIcon class="size-4" aria-hidden="true" />
						</Button>
					</div>
					{#if copiedField === 'clientSecret'}
						<p class="text-muted-foreground text-sm">Client secret copied.</p>
					{:else if configured && !revealedClientSecret}
						<p class="text-muted-foreground text-sm">
							The client secret is hidden after generation. Regenerate to issue a new one.
						</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="integration-auth-base-uri">Authentication Base URI</Label>
					<Input
						id="integration-auth-base-uri"
						type="url"
						bind:value={authBaseUri}
						autocomplete="off"
						disabled={Boolean(loadError) || !configured}
						aria-invalid={authBaseUriError ? 'true' : undefined}
					/>
					{#if authBaseUriError}
						<p class="text-destructive text-sm">{authBaseUriError}</p>
					{/if}
				</div>
			</div>
		{/if}

		<Dialog.Footer class="flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
			<p class="text-muted-foreground w-full text-sm sm:mr-auto sm:w-auto">Save your changes.</p>
			<Button
				type="button"
				variant="outline"
				disabled={saving || loading || generating || !configured || Boolean(loadError)}
				class={cn(saving && 'pointer-events-none cursor-wait')}
				onclick={saveAuthBaseUri}
			>
				{#if saving}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Saving…
				{:else}
					Save
				{/if}
			</Button>
			<Button type="button" disabled={saving || generating} onclick={() => (open = false)}>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
