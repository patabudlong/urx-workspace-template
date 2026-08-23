<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		WORKSPACE_MODULE_TRIAL_NOTICE_DESCRIPTION,
		WORKSPACE_MODULE_TRIAL_NOTICE_TITLE
	} from '$lib/shared/workspace-modules-messages';
	import type { WorkspacePackageMeta } from '$lib/shared/workspace-packages';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import InfoIcon from '@lucide/svelte/icons/info';
	import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import type { Component } from 'svelte';

	let {
		workspacePackage,
		icon: Icon,
		iconClass,
		enabled,
		settingsHref,
		moduleHref,
		helperText,
		onToggle
	}: {
		workspacePackage: WorkspacePackageMeta;
		icon: Component;
		iconClass: string;
		enabled: boolean;
		settingsHref: string;
		moduleHref: string;
		helperText?: string;
		onToggle: (enabled: boolean) => void;
	} = $props();

	let detailsOpen = $state(false);
</script>

<Card.Root class="h-full gap-0 py-0">
	<Card.Content class="flex flex-col gap-4 p-5 pb-5">
		<div class="flex items-start justify-between gap-3">
			<div class="flex size-10 shrink-0 items-center justify-center">
				<Icon class={iconClass} aria-hidden="true" />
			</div>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="icon-sm"
							class="text-muted-foreground hover:text-foreground -me-1 -mt-1"
							aria-label={`${workspacePackage.label} options`}
						>
							<EllipsisIcon class="size-4" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-44">
					<DropdownMenu.Item onclick={() => (detailsOpen = true)}>
						<InfoIcon class="size-4" />
						View details
					</DropdownMenu.Item>
					{#if enabled}
						<DropdownMenu.Item onclick={() => goto(moduleHref)}>
							<ExternalLinkIcon class="size-4" />
							Open module
						</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>

		<div class="min-w-0 space-y-2">
			<h3 class="text-base font-semibold tracking-tight">{workspacePackage.label}</h3>
			<p class="text-muted-foreground text-sm leading-relaxed">
				{workspacePackage.description}
			</p>
			{#if helperText}
				<p class="text-muted-foreground text-xs leading-relaxed">{helperText}</p>
			{/if}
		</div>
	</Card.Content>

	<Card.Footer class="justify-between gap-3 bg-transparent px-5 py-4">
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="icon-sm"
				href={enabled ? settingsHref : undefined}
				disabled={!enabled}
				aria-label={`${workspacePackage.label} settings`}
			>
				<SettingsIcon class="size-4" />
			</Button>
			<Button variant="outline" size="sm" class="h-8 px-3" onclick={() => (detailsOpen = true)}>
				Details
			</Button>
		</div>

		<Switch
			checked={enabled}
			onCheckedChange={(checked) => onToggle(checked === true)}
			aria-label={`Toggle ${workspacePackage.label}`}
		/>
	</Card.Footer>
</Card.Root>

<Sheet.Root bind:open={detailsOpen}>
	<Sheet.Content class="sm:max-w-md">
		<Sheet.Header>
			<div class="flex items-center gap-3">
				<div class="flex size-10 shrink-0 items-center justify-center">
					<Icon class={iconClass} aria-hidden="true" />
				</div>
				<div class="min-w-0">
					<Sheet.Title>{workspacePackage.label}</Sheet.Title>
					<Sheet.Description>Workspace module</Sheet.Description>
				</div>
			</div>
		</Sheet.Header>

		<div class="space-y-6 px-4 pb-4">
			<p class="text-muted-foreground text-sm leading-relaxed">
				{workspacePackage.description}
			</p>

			<div class="flex items-center justify-between gap-4 rounded-lg border p-4">
				<div class="min-w-0 space-y-1">
					<p class="text-sm font-medium">Module access</p>
					<p class="text-muted-foreground text-sm">
						{enabled
							? 'This module is visible in the sidebar for your team.'
							: 'Enable this module to make it available in your workspace.'}
					</p>
				</div>
				<Switch
					checked={enabled}
					onCheckedChange={(checked) => onToggle(checked === true)}
					aria-label={`Toggle ${workspacePackage.label}`}
				/>
			</div>

			<div
				class="border-primary/20 bg-primary/5 flex gap-3 rounded-lg border p-4"
				role="note"
			>
				<LightbulbIcon class="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<div class="min-w-0 space-y-1">
					<p class="text-sm font-medium">{WORKSPACE_MODULE_TRIAL_NOTICE_TITLE}</p>
					<p class="text-muted-foreground text-sm leading-relaxed">
						{WORKSPACE_MODULE_TRIAL_NOTICE_DESCRIPTION}
					</p>
				</div>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
