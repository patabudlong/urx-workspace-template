<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import WorkspaceModuleCard from '$lib/components/modules/workspace-module-card.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
	import { WORKSPACE_MODULES_UPDATED_MESSAGE } from '$lib/shared/workspace-modules-messages';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import ClipboardClockIcon from '@lucide/svelte/icons/clipboard-clock';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailIcon from '@lucide/svelte/icons/mail';
	import { enhance } from '$app/forms';
	import type { Component } from 'svelte';
	import type { WorkspacePackageId } from '$lib/shared/workspace-packages';

	let { data, form } = $props();

	let submitting = $state(false);

	const enabledPackages = $derived(
		(form?.enabledPackages ?? data.enabledPackages) as WorkspacePackageId[]
	);

	let selectedPackages = $state(new Set<WorkspacePackageId>());

	$effect(() => {
		selectedPackages = new Set(enabledPackages);
	});

	const packageIcons: Record<WorkspacePackageId, Component> = {
		[WORKSPACE_PACKAGE_IDS.MAILBOX]: MailIcon,
		[WORKSPACE_PACKAGE_IDS.PAYROLL]: BanknoteIcon,
		[WORKSPACE_PACKAGE_IDS.DTR]: ClipboardClockIcon
	};

	const packageIconClasses: Record<WorkspacePackageId, string> = {
		[WORKSPACE_PACKAGE_IDS.MAILBOX]: 'size-8 text-rose-600 dark:text-rose-400',
		[WORKSPACE_PACKAGE_IDS.PAYROLL]: 'size-8 text-emerald-600 dark:text-emerald-400',
		[WORKSPACE_PACKAGE_IDS.DTR]: 'size-8 text-violet-600 dark:text-violet-400'
	};

	const packageSettingsHrefs: Record<WorkspacePackageId, string> = {
		[WORKSPACE_PACKAGE_IDS.MAILBOX]: '/mailbox/settings/connection',
		[WORKSPACE_PACKAGE_IDS.PAYROLL]: '/payroll/settings',
		[WORKSPACE_PACKAGE_IDS.DTR]: '/dtr/settings'
	};

	const packageModuleHrefs: Record<WorkspacePackageId, string> = {
		[WORKSPACE_PACKAGE_IDS.MAILBOX]: '/mailbox/INBOX',
		[WORKSPACE_PACKAGE_IDS.PAYROLL]: '/payroll',
		[WORKSPACE_PACKAGE_IDS.DTR]: '/dtr'
	};

	const showSuccess = $derived(form?.message === WORKSPACE_MODULES_UPDATED_MESSAGE);
	const errorMessage = $derived(
		typeof form?.message === 'string' && form.message.length > 0 && !showSuccess
			? form.message
			: null
	);

	const hasChanges = $derived(
		enabledPackages.length !== selectedPackages.size ||
			enabledPackages.some((packageId) => !selectedPackages.has(packageId))
	);

	function togglePackage(packageId: WorkspacePackageId, enabled: boolean) {
		const next = new Set(selectedPackages);

		if (enabled) {
			next.add(packageId);
		} else {
			next.delete(packageId);
		}

		selectedPackages = next;
	}

	function isPackageSelected(packageId: WorkspacePackageId): boolean {
		return selectedPackages.has(packageId);
	}
</script>

<div class="flex w-full flex-col gap-6">
	<nav aria-label="Breadcrumb" class="text-muted-foreground text-sm">
		<ol class="flex flex-wrap items-center gap-2">
			<li>
				<a href="/" class="hover:text-foreground transition-colors">Home</a>
			</li>
			<li aria-hidden="true">/</li>
			<li class="text-foreground font-medium">Modules</li>
		</ol>
	</nav>

	<div class="space-y-1">
		<h1 class="text-2xl font-semibold tracking-tight">Modules</h1>
		<p class="text-muted-foreground max-w-2xl text-sm leading-relaxed">
			Choose which tools are available in your workspace. Enabled modules appear in the sidebar for
			your whole team.
		</p>
	</div>

	{#if showSuccess}
		<StatusAlert
			variant="success"
			title="Modules updated"
			description="Your workspace module selection has been saved."
		/>
	{/if}

	{#if errorMessage}
		<StatusAlert variant="danger" title="Unable to save modules" description={errorMessage} />
	{/if}

	{#if data.deployablePackages.length === 0}
		<Card.Root>
			<Card.Content class="text-muted-foreground py-10 text-center text-sm">
				No modules are available for this deployment yet.
			</Card.Content>
		</Card.Root>
	{:else}
		<form
			method="POST"
			action="?/update"
			class="space-y-6"
			use:enhance={() => {
				submitting = true;

				return async ({ result, update }) => {
					submitting = false;
					await update();

					if (result.type === 'success') {
						await invalidateAll();
					}
				};
			}}
		>
			{#each data.deployablePackages as workspacePackage (workspacePackage.id)}
				{#if isPackageSelected(workspacePackage.id)}
					<input type="hidden" name="enabledPackages" value={workspacePackage.id} />
				{/if}
			{/each}

			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h2 class="text-lg font-semibold tracking-tight">Modules</h2>
				<Button type="submit" class="h-10" disabled={submitting || !hasChanges}>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" />
						Saving...
					{:else}
						Save changes
					{/if}
				</Button>
			</div>

			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each data.deployablePackages as workspacePackage (workspacePackage.id)}
					<WorkspaceModuleCard
						{workspacePackage}
						icon={packageIcons[workspacePackage.id]}
						iconClass={packageIconClasses[workspacePackage.id]}
						settingsHref={packageSettingsHrefs[workspacePackage.id]}
						moduleHref={packageModuleHrefs[workspacePackage.id]}
						enabled={isPackageSelected(workspacePackage.id)}
						onToggle={(enabled) => togglePackage(workspacePackage.id, enabled)}
					/>
				{/each}
			</div>
		</form>
	{/if}
</div>
