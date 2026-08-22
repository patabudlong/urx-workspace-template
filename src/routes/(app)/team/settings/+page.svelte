<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import WorkspaceBrandLogoUpload from '$lib/components/onboarding/workspace-brand-logo-upload.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		WORKSPACE_LOGO_REMOVED_MESSAGE,
		WORKSPACE_LOGO_UPDATED_MESSAGE
	} from '$lib/shared/team/workspace-settings-messages';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let brandLogoFile = $state<File | null>(null);
	let brandLogoPreview = $state<string | null>(null);
	let removeLogo = $state(false);
	let logoError = $state<string | null>(null);
	let submitting = $state(false);

	const currentBrandLogoUrl = $derived(
		form?.brandLogoUrl !== undefined ? form.brandLogoUrl : data.brandLogoUrl
	);

	const displayPreviewUrl = $derived(
		removeLogo ? null : (brandLogoPreview ?? currentBrandLogoUrl)
	);

	const hasPendingChanges = $derived(Boolean(brandLogoFile) || removeLogo);

	const showSuccess = $derived(
		form?.message === WORKSPACE_LOGO_UPDATED_MESSAGE ||
			form?.message === WORKSPACE_LOGO_REMOVED_MESSAGE
	);

	const showError = $derived(
		typeof form?.message === 'string' &&
			form.message.length > 0 &&
			!showSuccess
	);

	function setBrandLogo(file: File | null) {
		logoError = null;
		removeLogo = false;

		if (brandLogoPreview) {
			URL.revokeObjectURL(brandLogoPreview);
		}

		if (!file) {
			brandLogoFile = null;
			brandLogoPreview = null;
			return;
		}

		brandLogoFile = file;
		brandLogoPreview = URL.createObjectURL(file);
	}

	function clearBrandLogo() {
		logoError = null;

		if (brandLogoPreview) {
			URL.revokeObjectURL(brandLogoPreview);
		}

		brandLogoFile = null;
		brandLogoPreview = null;
		removeLogo = true;
	}

	function handleBrandLogoError(message: string) {
		logoError = message;
	}

	function cancelPendingChanges() {
		logoError = null;

		if (brandLogoPreview) {
			URL.revokeObjectURL(brandLogoPreview);
		}

		brandLogoFile = null;
		brandLogoPreview = null;
		removeLogo = false;
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Team"
		title="Workspace settings"
		description="Manage how your workspace appears to teammates — including the logo shown in the header and during onboarding."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace logo</Card.Title>
			<Card.Description>
				Shown in the workspace switcher, invitations, and member onboarding. Without a logo, your
				workspace initials are used.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title={form?.message === WORKSPACE_LOGO_REMOVED_MESSAGE
						? 'Logo removed'
						: 'Logo updated'}
					description={form?.message ?? ''}
					class="mb-6"
				/>
			{:else if showError}
				<StatusAlert
					variant="danger"
					title="Could not update logo"
					description={form?.message ?? ''}
					class="mb-6"
				/>
			{:else if logoError}
				<StatusAlert
					variant="danger"
					title="Invalid logo"
					description={logoError}
					class="mb-6"
				/>
			{/if}

			<form
				method="POST"
				action="?/updateLogo"
				enctype="multipart/form-data"
				use:enhance={({ formData }) => {
					submitting = true;
					logoError = null;

					if (brandLogoFile) {
						formData.set('brandLogo', brandLogoFile);
					}

					return async ({ result, update }) => {
						submitting = false;

						if (result.type === 'success') {
							if (brandLogoPreview) {
								URL.revokeObjectURL(brandLogoPreview);
							}

							brandLogoFile = null;
							brandLogoPreview = null;
							removeLogo = false;
							await invalidateAll();
						}

						await update();
					};
				}}
				class="grid gap-5"
			>
				{#if removeLogo}
					<input type="hidden" name="removeLogo" value="true" />
				{/if}

				<div class="grid gap-2">
					<label class="text-sm font-medium" for="workspace-brand-logo">Company logo</label>
					<WorkspaceBrandLogoUpload
						previewUrl={displayPreviewUrl}
						fileName={brandLogoFile?.name ?? null}
						onchange={setBrandLogo}
						onclear={clearBrandLogo}
						onerror={handleBrandLogoError}
					/>
					<p class="text-muted-foreground text-xs">
						PNG, JPG, WebP, or SVG · up to 2 MB. Remove the logo to fall back to workspace initials.
					</p>
				</div>

				{#if hasPendingChanges}
					<div class="flex flex-wrap items-center gap-3">
						<Button type="submit" class="h-10" disabled={submitting}>
							{#if submitting}
								<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
								Saving logo...
							{:else}
								Save logo
							{/if}
						</Button>
						<Button
							type="button"
							variant="outline"
							class="h-10"
							disabled={submitting}
							onclick={cancelPendingChanges}
						>
							Cancel
						</Button>
					</div>
				{:else}
					<Button type="submit" class="h-10" disabled>
						Save logo
					</Button>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>
</div>
