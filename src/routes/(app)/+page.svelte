<script lang="ts">
	import DashboardCard from '$lib/components/dashboard/dashboard-card.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatCard from '$lib/components/dashboard/stat-card.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatWorkspaceRole } from '$lib/navigation/app-nav';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import UsersIcon from '@lucide/svelte/icons/users';

	let { data } = $props();

	const greetingName = $derived(data.firstName || data.user.email.split('@')[0] || 'there');
	const workspace = $derived(data.workspace);
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Workspace overview"
		title={`Welcome back, ${greetingName}`}
		description="Your workspace hub for day-to-day operations, team access, and developer resources."
	>
		{#snippet actions()}
			<Button href="/docs" variant="outline" size="sm">
				<BookOpenIcon class="size-4" />
				API docs
			</Button>
		{/snippet}
	</PageHeader>

	{#if workspace}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			<StatCard
				label="Workspace"
				value={workspace.workspaceName}
				period="{workspace.workspaceSlug}.workspace.urixoft.com"
				icon={Building2Icon}
			/>
			<StatCard
				label="Your role"
				value={formatWorkspaceRole(workspace.role)}
				period="Workspace access"
				trend={{
					label: workspace.role === 'owner' ? 'Full access' : 'Member',
					direction: 'neutral'
				}}
				hint={workspace.role === 'owner'
					? 'You can manage workspace settings and invite teammates.'
					: 'You have member access to this workspace.'}
				icon={UsersIcon}
			/>
			<StatCard
				label="Status"
				value="Active"
				period="Current workspace"
				trend={{ label: 'Healthy', direction: 'up' }}
				hint="Your workspace is approved and ready to use."
				icon={ShieldCheckIcon}
				class="sm:col-span-2 xl:col-span-1"
			/>
		</div>
	{/if}

	<div class="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
		<DashboardCard>
			<Card.Header>
				<Card.Title>Quick actions</Card.Title>
				<Card.Description>Common links for your team and developers.</Card.Description>
			</Card.Header>
			<Card.Content class="grid gap-3 sm:grid-cols-2">
				<Button href="/docs" variant="outline" class="h-auto justify-start px-4 py-3">
					<div class="flex w-full items-center gap-3">
						<div class="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
							<BookOpenIcon class="size-4" />
						</div>
						<div class="min-w-0 text-left">
							<p class="text-sm font-medium">Browse API docs</p>
							<p class="text-muted-foreground text-xs">OpenAPI reference for web and mobile clients</p>
						</div>
					</div>
				</Button>

				<Button href="/api/v1/health" variant="outline" class="h-auto justify-start px-4 py-3" target="_blank">
					<div class="flex w-full items-center gap-3">
						<div class="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
							<ActivityIcon class="size-4" />
						</div>
						<div class="min-w-0 text-left">
							<p class="text-sm font-medium">Check API health</p>
							<p class="text-muted-foreground text-xs">Verify connectivity and service status</p>
						</div>
					</div>
				</Button>
			</Card.Content>
		</DashboardCard>

		<DashboardCard>
			<Card.Header>
				<Card.Title>Getting started</Card.Title>
				<Card.Description>What you can do from here.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<ul class="space-y-3 text-sm">
					<li class="flex items-start gap-3">
						<span class="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true"></span>
						<span class="text-muted-foreground leading-relaxed">
							Use the sidebar to move between overview and developer resources.
						</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true"></span>
						<span class="text-muted-foreground leading-relaxed">
							Share your workspace URL with teammates when inviting them to join.
						</span>
					</li>
					<li class="flex items-start gap-3">
						<span class="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true"></span>
						<span class="text-muted-foreground leading-relaxed">
							Connect mobile apps to the versioned JSON API under <code class="text-xs">/api/v1</code>.
						</span>
					</li>
				</ul>

				<Button href="/docs" size="sm" class="w-full sm:w-auto">
					Explore the API
					<ArrowRightIcon class="size-4" />
				</Button>
			</Card.Content>
		</DashboardCard>
	</div>

	<StatusAlert
		variant="info"
		title="Workspace modules are coming next"
		description="Team management, settings, and operational tools will appear here as modules are added to the template."
	/>
</div>
