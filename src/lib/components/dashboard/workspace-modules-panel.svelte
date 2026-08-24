<script lang="ts">
	import DashboardCard from '$lib/components/dashboard/dashboard-card.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { WorkspaceOverviewModule } from '$lib/shared/dashboard/overview';
	import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import ClipboardClockIcon from '@lucide/svelte/icons/clipboard-clock';
	import MailIcon from '@lucide/svelte/icons/mail';
	import type { Component } from 'svelte';

	let { modules }: { modules: WorkspaceOverviewModule[] } = $props();

	const moduleIcons: Record<string, Component> = {
		[WORKSPACE_PACKAGE_IDS.MAILBOX]: MailIcon,
		[WORKSPACE_PACKAGE_IDS.PAYROLL]: BanknoteIcon,
		[WORKSPACE_PACKAGE_IDS.DTR]: ClipboardClockIcon
	};

	const moduleIconClasses: Record<string, string> = {
		[WORKSPACE_PACKAGE_IDS.MAILBOX]: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
		[WORKSPACE_PACKAGE_IDS.PAYROLL]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
		[WORKSPACE_PACKAGE_IDS.DTR]: 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
	};
</script>

<DashboardCard class="h-full">
	<Card.Header>
		<Card.Title>Workspace modules</Card.Title>
		<Card.Description>Operational packages enabled for this workspace.</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-3">
		{#each modules as module (module.id)}
			{@const Icon = moduleIcons[module.id]}
			<a
				href={module.href}
				class="hover:bg-muted/50 flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors"
			>
				<div
					class="{moduleIconClasses[module.id]} flex size-10 shrink-0 items-center justify-center rounded-lg"
				>
					{#if Icon}
						<Icon class="size-4" />
					{/if}
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium">{module.label}</p>
					<p class="text-muted-foreground truncate text-xs">{module.description}</p>
				</div>
				<Badge variant={module.enabled ? 'default' : 'outline'}>
					{module.enabled ? 'Running' : 'Paused'}
				</Badge>
			</a>
		{/each}
	</Card.Content>
</DashboardCard>
