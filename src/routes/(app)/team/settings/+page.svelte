<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import WorkspaceBrandLogoUpload from '$lib/components/onboarding/workspace-brand-logo-upload.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		WORKSPACE_LOGO_REMOVED_MESSAGE,
		WORKSPACE_LOGO_UPDATED_MESSAGE,
		WORKSPACE_NAME_UPDATED_MESSAGE,
		WORKSPACE_NAME_UPDATE_FAILED_MESSAGE
	} from '$lib/shared/team/workspace-settings-messages';
	import { updateWorkspaceNameSchema } from '$lib/shared/schemas/workspace-settings';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data, form } = $props();

	let brandLogoFile = $state<File | null>(null);
	let brandLogoPreview = $state<string | null>(null);
	let removeLogo = $state(false);
	let logoError = $state<string | null>(null);
	let logoSubmitting = $state(false);
	let nameSubmitting = $state(false);
	let nameShowSuccess = $state(false);

	const nameSuperform = superForm(untrack(() => data.nameForm), {
		id: 'workspaceNameForm',
		validators: zod4Client(updateWorkspaceNameSchema),
		resetForm: false,
		onSubmit: () => {
			nameSubmitting = true;
			nameShowSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			nameSubmitting = false;

			if (updatedForm.message === WORKSPACE_NAME_UPDATED_MESSAGE) {
				nameShowSuccess = true;
				await invalidateAll();
			}
		},
		onError: () => {
			nameSubmitting = false;
		}
	});

	const {
		enhance: nameEnhance,
		form: nameForm,
		message: nameFormMessage
	} = nameSuperform;

	const nameFormError = $derived(
		typeof $nameFormMessage === 'string' &&
			$nameFormMessage.length > 0 &&
			$nameFormMessage !== WORKSPACE_NAME_UPDATED_MESSAGE
			? $nameFormMessage
			: null
	);

	const currentBrandLogoUrl = $derived(
		form?.brandLogoUrl !== undefined ? form.brandLogoUrl : data.brandLogoUrl
	);

	const displayPreviewUrl = $derived(
		removeLogo ? null : (brandLogoPreview ?? currentBrandLogoUrl)
	);

	const hasPendingLogoChanges = $derived(Boolean(brandLogoFile) || removeLogo);

	const showLogoSuccess = $derived(
		form?.message === WORKSPACE_LOGO_UPDATED_MESSAGE ||
			form?.message === WORKSPACE_LOGO_REMOVED_MESSAGE
	);

	const showLogoError = $derived(
		typeof form?.message === 'string' &&
			form.message.length > 0 &&
			!showLogoSuccess
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

	function cancelPendingLogoChanges() {
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
		description="Manage your workspace name and how it appears to teammates — including the logo shown in the header and during onboarding."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace name</Card.Title>
			<Card.Description>
				Shown in the workspace switcher, invitations, and across your team experience.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/updateName" use:nameEnhance class="max-w-xl space-y-5">
				{#if nameShowSuccess}
					<StatusAlert
						variant="success"
						title="Workspace name updated"
						description="Your workspace name has been saved."
					/>
				{:else if nameFormError}
					<StatusAlert
						variant="danger"
						title={nameFormError === WORKSPACE_NAME_UPDATE_FAILED_MESSAGE
							? 'Update failed'
							: 'Could not save workspace name'}
						description={nameFormError}
					/>
				{/if}

				<Form.Field form={nameSuperform} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Workspace name</Form.Label>
							<Input
								{...props}
								type="text"
								autocomplete="organization"
								disabled={nameSubmitting}
								bind:value={$nameForm.name}
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<Button type="submit" class="h-10" disabled={nameSubmitting}>
					{#if nameSubmitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Saving name...
					{:else}
						Save name
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root class="max-w-xl">
		<Card.Header>
			<Card.Title>Workspace logo</Card.Title>
			<Card.Description>
				Shown in the workspace switcher, invitations, and member onboarding. Without a logo, your
				workspace initials are used.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if showLogoSuccess}
				<StatusAlert
					variant="success"
					title={form?.message === WORKSPACE_LOGO_REMOVED_MESSAGE
						? 'Logo removed'
						: 'Logo updated'}
					description={form?.message ?? ''}
					class="mb-6"
				/>
			{:else if showLogoError}
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
					logoSubmitting = true;
					logoError = null;

					if (brandLogoFile) {
						formData.set('brandLogo', brandLogoFile);
					}

					return async ({ result, update }) => {
						logoSubmitting = false;

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

				{#if hasPendingLogoChanges}
					<div class="flex flex-wrap items-center gap-3">
						<Button type="submit" class="h-10" disabled={logoSubmitting}>
							{#if logoSubmitting}
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
							disabled={logoSubmitting}
							onclick={cancelPendingLogoChanges}
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
