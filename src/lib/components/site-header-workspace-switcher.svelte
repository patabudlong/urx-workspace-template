<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import WorkspaceAvatar from '$lib/components/workspace-avatar.svelte';
	import { formatWorkspaceRole } from '$lib/navigation/app-nav';
	import type { WorkspaceContext } from '$lib/shared/workspace-context';
	import { buildWorkspaceUrl } from '$lib/shared/workspace-host';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	let {
		workspace,
		workspaces = [],
		workspaceHostSuffix
	}: {
		workspace: WorkspaceContext | null;
		workspaces?: WorkspaceContext[];
		workspaceHostSuffix: string;
	} = $props();

	const hasMultipleWorkspaces = $derived(workspaces.length > 1);

	function switchWorkspace(target: WorkspaceContext) {
		if (!workspace || target.workspaceId === workspace.workspaceId) {
			return;
		}

		const destination = buildWorkspaceUrl(target.workspaceSlug, {
			suffix: workspaceHostSuffix,
			protocol: window.location.protocol,
			port: window.location.port,
			path: window.location.pathname + window.location.search
		});

		window.location.assign(destination);
	}
</script>

{#snippet workspaceLabel(item: WorkspaceContext, className?: string)}
	<div class={cn('grid min-w-0 max-w-[12rem] text-left leading-tight sm:max-w-xs', className)}>
		<span class="truncate text-sm font-medium">{item.workspaceName}</span>
		<span class="text-muted-foreground truncate text-xs">{formatWorkspaceRole(item.role)}</span>
	</div>
{/snippet}

{#snippet workspaceRow(item: WorkspaceContext, className?: string)}
	<div class={cn('flex min-w-0 items-center gap-2.5', className)}>
		<WorkspaceAvatar
			workspaceName={item.workspaceName}
			brandLogoUrl={item.brandLogoUrl}
			class="size-8"
		/>
		{@render workspaceLabel(item, 'max-w-none flex-1')}
	</div>
{/snippet}

{#if workspace}
	{#if hasMultipleWorkspaces}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="hover:bg-accent hover:text-accent-foreground inline-flex max-w-[14rem] items-center gap-2 rounded-md px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
			>
				{@render workspaceRow(workspace, 'min-w-0 flex-1')}
				<ChevronsUpDownIcon class="size-4 shrink-0 opacity-60" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start" class="w-72">
				<DropdownMenu.Label>Workspaces</DropdownMenu.Label>
				<DropdownMenu.Separator />
				{#each workspaces as item (item.workspaceId)}
					<DropdownMenu.Item
						class="items-start py-2"
						onSelect={() => switchWorkspace(item)}
					>
						{@render workspaceRow(item, 'min-w-0 flex-1')}
						{#if item.workspaceId === workspace.workspaceId}
							<CheckIcon class="mt-1 ml-auto size-4 shrink-0" />
						{/if}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<div class="px-2 py-1">
			{@render workspaceRow(workspace)}
		</div>
	{/if}
{/if}
